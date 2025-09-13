import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTimeEntryDto } from '../dto/create-time-entry.dto';

@Injectable()
export class ValidationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Valide que toutes les relations existent et sont valides
   */
  async validateRelations(createTimeEntryDto: CreateTimeEntryDto): Promise<void> {
    const promises = [];

    // Validation de l'utilisateur
    promises.push(
      this.prisma.user.findUnique({
        where: { id: createTimeEntryDto.userId }
      }).then(user => {
        if (!user) {
          throw new NotFoundException(`Utilisateur avec l'ID ${createTimeEntryDto.userId} non trouvé`);
        }
        return user;
      })
    );

    // Validation du projet si fourni
    if (createTimeEntryDto.projectId) {
      promises.push(
        this.prisma.project.findUnique({
          where: { id: createTimeEntryDto.projectId }
        }).then(project => {
          if (!project) {
            throw new NotFoundException(`Projet avec l'ID ${createTimeEntryDto.projectId} non trouvé`);
          }
          return project;
        })
      );
    }

    // Validation de la tâche si fournie
    if (createTimeEntryDto.taskId) {
      promises.push(
        this.prisma.task.findUnique({
          where: { id: createTimeEntryDto.taskId }
        }).then(task => {
          if (!task) {
            throw new NotFoundException(`Tâche avec l'ID ${createTimeEntryDto.taskId} non trouvée`);
          }
          
          // Vérifier que la tâche appartient au projet si les deux sont fournis
          if (createTimeEntryDto.projectId && task.projectId !== createTimeEntryDto.projectId) {
            throw new BadRequestException(
              `La tâche ${createTimeEntryDto.taskId} n'appartient pas au projet ${createTimeEntryDto.projectId}`
            );
          }
          
          return task;
        })
      );
    }

    // Attendre toutes les validations
    await Promise.all(promises);
  }

  /**
   * Valide les contraintes de dates
   */
  validateTimeConstraints(startTime: string, endTime: string): void {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      throw new BadRequestException('L\'heure de fin doit être postérieure à l\'heure de début');
    }
    
    // Vérifier que ce n'est pas dans le futur
    const now = new Date();
    if (start > now) {
      throw new BadRequestException('L\'heure de début ne peut pas être dans le futur');
    }
    
    // Vérifier que l'entrée n'est pas trop ancienne (ex: plus de 30 jours)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (start < thirtyDaysAgo) {
      throw new BadRequestException('L\'entrée de temps ne peut pas dater de plus de 30 jours');
    }
  }

  /**
   * Vérifie les chevauchements de temps pour un utilisateur
   */
  async checkTimeOverlap(
    userId: string, 
    startTime: Date, 
    endTime: Date, 
    excludeId?: string
  ): Promise<void> {
    const overlapping = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      throw new BadRequestException(
        `Chevauchement détecté avec une entrée existante (${overlapping.id})`
      );
    }
  }
}
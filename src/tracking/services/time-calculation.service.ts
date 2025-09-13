import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateTimeEntryDto } from '../dto/create-time-entry.dto';


@Injectable()
export class TimeCalculationService {
  
  /**
   * Calcule les heures entre deux dates
   */
  calculateHours(startTime: string, endTime: string): Decimal {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Validation des dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Dates invalides');
    }
    
    if (end <= start) {
      throw new Error('L\'heure de fin doit être postérieure à l\'heure de début');
    }
    
    // Calcul en heures avec 2 décimales
    const milliseconds = end.getTime() - start.getTime();
    const hours = milliseconds / (1000 * 60 * 60);
    
    return new Decimal(hours.toFixed(2));
  }
  
  /**
   * Prépare les données pour la création d'une entrée de temps
   */
  prepareTimeEntryData(createTimeEntryDto: CreateTimeEntryDto) {
    let finalHours: Decimal;
    
    // Si startTime et endTime sont fournis, on calcule automatiquement
    if (createTimeEntryDto.startTime && createTimeEntryDto.endTime) {
      finalHours = this.calculateHours(
        createTimeEntryDto.startTime, 
        createTimeEntryDto.endTime
      );
    } else {
      // Sinon on utilise les heures fournies
      finalHours = new Decimal(createTimeEntryDto.hours);
    }
    
    return {
      ...createTimeEntryDto,
      hours: finalHours,
      startTime: new Date(createTimeEntryDto.startTime),
      endTime: new Date(createTimeEntryDto.endTime)
    };
  }
}
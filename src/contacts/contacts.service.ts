import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactFilterDto } from './dto/contact-filter.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto) {
    return this.prisma.contact.create({
      data: createContactDto,
      include: {
        company: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async findAll(filters: ContactFilterDto) {
    const { search, contactType, status, companyId, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (contactType) where.contactType = contactType;
    if (status) where.status = status;
    if (companyId) where.companyId = companyId;

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: {
          company: {
            select: { id: true, name: true }
          },
          opportunities: {
            select: {
              id: true,
              dealName: true,
              estimatedValue: true,
              stage: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.contact.count({ where })
    ]);

    return {
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true }
        },
        opportunities: {
          select: {
            id: true,
            dealName: true,
            estimatedValue: true,
            stage: true,
            expectedCloseDate: true
          }
        }
      }
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async getOpportunities(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      select: {
        opportunities: {
          include: {
            contact: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact.opportunities;
  }

  async update(id: string, updateContactDto: UpdateContactDto) {
    try {
      return await this.prisma.contact.update({
        where: { id },
        data: updateContactDto,
        include: {
          company: {
            select: { id: true, name: true }
          }
        }
      });
    } catch (error) {
      throw new NotFoundException('Contact not found');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.contact.delete({
        where: { id }
      });
    } catch (error) {
      throw new NotFoundException('Contact not found');
    }
  }
}
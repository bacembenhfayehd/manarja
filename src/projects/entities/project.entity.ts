import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne,JoinColumn } from 'typeorm';

import { ProjectPhase } from './project-phase.entity';
import { ProjectTask } from './project-task.entity';
import { ProjectTemplate } from './project-template.entity';
import { ProjectStatus, ProjectType } from '../enum/project.enum';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.PLANNING })
  status: ProjectStatus;

  @Column({ type: 'enum', enum: ProjectType })
  type: ProjectType;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  budget?: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relations
  @OneToMany(() => ProjectPhase, phase => phase.project)
  phases: ProjectPhase[];

  @OneToMany(() => ProjectTask, task => task.project)
  tasks: ProjectTask[];

  @ManyToOne(() => ProjectTemplate, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template?: ProjectTemplate;
}
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Project } from './project.entity';
import { ProjectTask } from './project-task.entity';
import { MilestoneStatus } from '../enum/project.enum';


@Entity('project_phases')
export class ProjectPhase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.PENDING })
  status: MilestoneStatus;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  // Relations
  @ManyToOne(() => Project, project => project.phases)
  project: Project;

  @OneToMany(() => ProjectTask, task => task.phase)
  tasks: ProjectTask[];
}
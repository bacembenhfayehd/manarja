import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Project } from './project.entity';
import { ProjectPhase } from './project-phase.entity';
import { TaskPriority, TaskStatus } from '../enum/task.enum';


@Entity('project_tasks')
export class ProjectTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: Date;

  // Relations
  @ManyToOne(() => Project, project => project.tasks)
  project: Project;

  @ManyToOne(() => ProjectPhase, phase => phase.tasks, { nullable: true })
  phase?: ProjectPhase;
}
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Project } from './project.entity';
import { ProjectType } from '../enum/project.enum';


@Entity('project_templates')
export class ProjectTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ProjectType })
  type: ProjectType;

  @Column({ type: 'jsonb' })
  structure: {
    phases: Array<{
      name: string;
      defaultTasks: Array<{
        title: string;
        description?: string;
      }>;
    }>;
  };

  @OneToMany(() => Project, project => project.template)
  projects: Project[];
}
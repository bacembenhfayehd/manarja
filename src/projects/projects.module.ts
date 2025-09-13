import { Module } from '@nestjs/common';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectPhasesController } from './controllers/project-phases.controller';
import { ProjectTasksController } from './controllers/project-tasks.controller';
import { ProjectTemplatesController } from './controllers/project-templates.controller';
import { ProjectsService } from './services/projects.service';
import { ProjectPhasesService } from './services/project-phases.service';
import { ProjectTasksService } from './services/project-tasks.service';
import { ProjectTemplatesService } from './services/project-templates.service';


@Module({
  controllers: [ProjectsController, ProjectPhasesController, ProjectTasksController, ProjectTemplatesController],
  providers: [ProjectsService, ProjectPhasesService, ProjectTasksService, ProjectTemplatesService]
})
export class ProjectsModule {}

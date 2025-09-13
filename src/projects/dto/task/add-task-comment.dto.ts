import { IsString, MaxLength } from "class-validator";

export class AddTaskCommentDto {
  @IsString()
  @MaxLength(1000)
  content: string;
}
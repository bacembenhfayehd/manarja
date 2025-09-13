import { IsArray, IsUUID, IsNotEmpty, ArrayNotEmpty, IsString } from 'class-validator';

export class AssignTagsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  documentIds: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tagNames: string[];
}

export class UnassignTagsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  documentIds: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tagNames: string[];
}

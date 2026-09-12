import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { DealStage } from '@comtech/types';
import { DEAL_STAGES } from './create-deal.dto';

/**
 * DTO chuyển cơ hội sang giai đoạn khác (kéo thả Kanban).
 */
export class MoveStageDto {
  @IsIn(DEAL_STAGES, { message: 'Giai đoạn không hợp lệ.' })
  stage: DealStage;

  /** Lý do thất bại (bắt buộc khi chuyển sang closed_lost). */
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Lý do thất bại quá dài.' })
  lostReason?: string;
}

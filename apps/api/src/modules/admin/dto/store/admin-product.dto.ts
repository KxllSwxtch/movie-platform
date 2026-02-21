import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminProductQueryDto {
  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  minPrice?: number;

  @ApiPropertyOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Мерч-футболка MoviePlatform' })
  name!: string;

  @ApiPropertyOptional({ example: 'Стильная футболка с логотипом платформы' })
  description?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiProperty({ example: 1990 })
  price!: number;

  @ApiPropertyOptional({ example: 500 })
  bonusPrice?: number;

  @ApiPropertyOptional({ default: true })
  allowsPartialBonus?: boolean;

  @ApiProperty({ example: 100 })
  stockQuantity!: number;

  @ApiPropertyOptional({ type: [String] })
  images?: string[];

  @ApiPropertyOptional({ default: 'DRAFT' })
  status?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  bonusPrice?: number;

  @ApiPropertyOptional()
  allowsPartialBonus?: boolean;

  @ApiPropertyOptional()
  stockQuantity?: number;

  @ApiPropertyOptional({ type: [String] })
  images?: string[];

  @ApiPropertyOptional()
  status?: string;
}

export class ProductStatsDto {
  @ApiProperty()
  totalProducts!: number;

  @ApiProperty()
  activeCount!: number;

  @ApiProperty()
  draftCount!: number;

  @ApiProperty()
  outOfStockCount!: number;

  @ApiProperty()
  discontinuedCount!: number;
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Одежда' })
  name!: string;

  @ApiPropertyOptional({ example: 'odezhda' })
  slug?: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiPropertyOptional({ example: 0 })
  order?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  slug?: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiPropertyOptional()
  order?: number;
}

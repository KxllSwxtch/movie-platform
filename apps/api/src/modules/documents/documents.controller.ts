import {
  Controller,
  Get,
  Post,
  Param,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LegalDocumentType } from '@movie-platform/shared';
import { Request } from 'express';

import { DocumentsService } from './documents.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * List all active documents (metadata only).
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'List all active legal documents' })
  @ApiResponse({ status: 200, description: 'List of active documents' })
  async findAll() {
    return this.documentsService.findAll();
  }

  /**
   * Get pending documents for the current user.
   */
  @Get('pending')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending documents for current user' })
  @ApiResponse({ status: 200, description: 'List of pending documents' })
  async getPendingDocuments(@CurrentUser('id') userId: string) {
    return this.documentsService.getPendingDocuments(userId);
  }

  /**
   * Get document by type (with full content).
   */
  @Get(':type')
  @Public()
  @ApiOperation({ summary: 'Get active document by type' })
  @ApiResponse({ status: 200, description: 'Document with full content' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findByType(@Param('type') type: LegalDocumentType) {
    return this.documentsService.findByType(type);
  }

  /**
   * Accept a document.
   */
  @Post(':type/accept')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a legal document' })
  @ApiResponse({ status: 201, description: 'Document accepted' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async acceptDocument(
    @Param('type') type: LegalDocumentType,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    const document = await this.documentsService.findByType(type);
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.documentsService.acceptDocument(
      userId,
      document.id,
      ipAddress,
      userAgent,
    );
  }
}

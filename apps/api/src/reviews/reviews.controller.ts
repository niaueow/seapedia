import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    // Public: anyone (including guests) can post a review.
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateReviewDto) {
        return this.reviewsService.createReview(dto);
    }

    // Public: anyone can read reviews.
    @Get()
    list(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.reviewsService.listReviews(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
    }
}
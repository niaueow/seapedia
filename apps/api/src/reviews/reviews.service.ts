import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
    constructor(private readonly prisma: PrismaService) { }

    async createReview(dto: CreateReviewDto) {
        const review = await this.prisma.review.create({
            data: {
                reviewerName: dto.reviewerName,
                rating: dto.rating,
                comment: dto.comment,
                // userId stays null: these are public app reviews.
            },
        });

        return {
            id: review.id,
            reviewerName: review.reviewerName,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
        };
    }

    async listReviews(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.review.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    reviewerName: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                },
            }),
            this.prisma.review.count(),
        ]);

        // A small bonus: the average rating, handy for a "4.5 stars" display.
        const aggregate = await this.prisma.review.aggregate({
            _avg: { rating: true },
        });
        const averageRating = aggregate._avg.rating ?? 0;

        return { data, page, limit, total, averageRating };
    }
}
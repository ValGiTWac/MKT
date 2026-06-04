import Post from '../models/Post';
import User from '../models/User';
import { createError } from '../middleware/errorHandler';
import { PostDocument, PostStatus, SocialPlatform } from '../models/Post';

interface CreatePostData {
  title: string;
  content: string;
  platforms: SocialPlatform[];
  scheduledAt?: string;
  tags?: string[];
  images?: string[];
}

interface UpdatePostData extends Partial<CreatePostData> {
  status?: PostStatus;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const postService = {
  // Get all posts with pagination
  getAllPosts: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<PostDocument>> => {
    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      Post.find()
        .populate('authorId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(),
    ]);

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Get single post
  getPostById: async (id: string): Promise<PostDocument> => {
    const post = await Post.findById(id).populate('authorId', 'name email role');
    if (!post) {
      throw createError('Post not found', 404);
    }
    return post;
  },

  // Create new post
  createPost: async (userId: string, data: CreatePostData): Promise<PostDocument> => {
    const post = new Post({
      ...data,
      authorId: userId,
    });
    await post.save();
    
    // Populate author
    await post.populate('authorId', 'name email role');
    return post;
  },

  // Update post
  updatePost: async (id: string, userId: string, data: UpdatePostData): Promise<PostDocument> => {
    const post = await Post.findById(id);
    if (!post) {
      throw createError('Post not found', 404);
    }

    // Check if user is the author or has permission
    if (post.authorId.toString() !== userId) {
      throw createError('You are not authorized to update this post', 403);
    }

    Object.assign(post, data);
    await post.save();
    
    await post.populate('authorId', 'name email role');
    return post;
  },

  // Delete post
  deletePost: async (id: string, userId: string): Promise<void> => {
    const post = await Post.findById(id);
    if (!post) {
      throw createError('Post not found', 404);
    }

    // Check if user is the author or has permission
    if (post.authorId.toString() !== userId) {
      throw createError('You are not authorized to delete this post', 403);
    }

    await Post.findByIdAndDelete(id);
  },

  // Get posts by status
  getPostsByStatus: async (status: PostStatus, page: number = 1, limit: number = 10): Promise<PaginatedResponse<PostDocument>> => {
    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      Post.find({ status })
        .populate('authorId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ status }),
    ]);

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Get posts by author
  getPostsByAuthor: async (authorId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<PostDocument>> => {
    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      Post.find({ authorId })
        .populate('authorId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ authorId }),
    ]);

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Search posts
  searchPosts: async (query: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<PostDocument>> => {
    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      Post.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
        ],
      })
        .populate('authorId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
        ],
      }),
    ]);

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Approve post (manager/admin only)
  approvePost: async (id: string): Promise<PostDocument> => {
    const post = await Post.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    ).populate('authorId', 'name email role');
    
    if (!post) {
      throw createError('Post not found', 404);
    }
    return post;
  },

  // Reject post (manager/admin only)
  rejectPost: async (id: string, reason?: string): Promise<PostDocument> => {
    const post = await Post.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true }
    ).populate('authorId', 'name email role');
    
    if (!post) {
      throw createError('Post not found', 404);
    }
    return post;
  },

  // Schedule post
  schedulePost: async (id: string, scheduledAt: string): Promise<PostDocument> => {
    const post = await Post.findByIdAndUpdate(
      id,
      { 
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
      },
      { new: true }
    ).populate('authorId', 'name email role');
    
    if (!post) {
      throw createError('Post not found', 404);
    }
    return post;
  },

  // Publish post immediately
  publishPost: async (id: string): Promise<PostDocument> => {
    const post = await Post.findByIdAndUpdate(
      id,
      { 
        status: 'published',
        publishedAt: new Date(),
      },
      { new: true }
    ).populate('authorId', 'name email role');
    
    if (!post) {
      throw createError('Post not found', 404);
    }
    return post;
  },
};

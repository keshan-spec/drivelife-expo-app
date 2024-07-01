export interface WebMessage {
    type: 'authData' | 'createPost';
    user_id: string;
}

export interface CreatePostProps {
    media: any[];
    caption?: string;
    location?: string;
    taggedEntities?: any[];
}
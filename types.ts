export interface WebMessage {
    type: 'createPost' | 'addEventPost' | 'authData' | 'signOut';
    user_id: string;
    page?: string;
    association_id?: string;
    association_type?: 'event' | 'venue' | 'garage';
}

export interface CreatePostProps {
    media: any[];
    caption?: string;
    location?: string;
    taggedEntities?: any[];
}

export interface TagEntity {
    name: string;
    type: string;
    entity_id: string;
    image: string;
}
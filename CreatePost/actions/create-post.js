export const API_URL = 'https://wordpress-889362-4267074.cloudwaysapps.com/uk';

export const addPost = async (user_id, mediaList, caption = '', location = '') => {
    try {
        if (!user_id || !mediaList || mediaList.length === 0) {
            throw new Error("Invalid data");
        }

        const formData = new FormData();
        formData.append("user_id", user_id);
        formData.append("caption", caption || "");
        formData.append("location", location || "");
        formData.append("mediaData", JSON.stringify(mediaList));

        const response = await fetch(`${API_URL}/wp-json/app/v1/save-media`, {
            cache: "no-cache",
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (!data || data.error) {
            throw new Error(data.error);
        }

        if (response.status !== 200) {
            throw new Error("Failed to create post");
        }

        return data;
    } catch (e) {
        console.log(e.message);
        throw new Error("Failed to create post");
    }
};

export const addTagsForPost = async (user_id, postId, tags) => {
    try {
        if (!user_id || !postId || !tags || tags.length === 0) {
            throw new Error("Invalid data");
        }

        const response = await fetch(`${API_URL}/wp-json/app/v1/add-tags`, {
            cache: "no-cache",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id, post_id: postId, tags }),
        });

        const data = await response.json();
        if (!response.ok || response.status !== 200) {
            throw new Error(data.message);
        }

        return data;
    } catch (e) {
        console.error("Error adding tags", e.message);
        return null;
    }
};

export const fetchTaggableEntites = async (user_id, search, tagged_entities, is_vehicle) => {
    const url = is_vehicle ? `${API_URL}/wp-json/app/v1/get-taggable-vehicles` : `${API_URL}/wp-json/app/v1/get-taggable-entities`;

    try {
        const response = await fetch(url, {
            cache: "no-cache",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ search, user_id, tagged_entities }),
        });

        const data = await response.json();
        if (!response.ok || response.status !== 200) {
            throw new Error(data.message);
        }

        return data;
    } catch (e) {
        return [];
    }
};
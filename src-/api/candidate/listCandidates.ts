import { axios } from "../../lib/axios";

export const listCandidates = async (skip: number, limit: number) => {
    try {
        let result: any = await axios.get('candidates?skip=' + skip + '&limit=' + limit);
        return result.data;
    } catch (error) {

    }
    return [];
};

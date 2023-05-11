import { axios } from "../../lib/axios";

export const fetchCandidate = async (token: any) => {
    try {
        let result: any = await axios.get('candidates/fetch?token=' + token);
        return result.data.candidate;
    } catch (error) {

    }
    return false;
};

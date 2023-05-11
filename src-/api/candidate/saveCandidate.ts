import { axios } from "../../lib/axios";
import toast from "react-hot-toast";

export const saveCandidate = async (candidate: any) => {
    try {
        await axios.post('candidates', {candidate});
        toast.success('Saved successfully');
        return true;
    } catch (error) {

    }
    return false;
};

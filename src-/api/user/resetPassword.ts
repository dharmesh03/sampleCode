import toast from "react-hot-toast";
import { axios } from "../../lib/axios";

export const resetPassword = async ({password, token}: any) => {
    try {
        await axios.put('users/change-password', {password, token});
        toast.success('Reset Password');
        return true;
    } catch (error) {
        toast.error((error as any).response.data.error);
    }
    return false;
};

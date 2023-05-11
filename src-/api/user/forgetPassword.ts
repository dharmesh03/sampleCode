import toast from "react-hot-toast";
import { axios } from "../../lib/axios";

export const forgetPassword = async ({email}: any) => {
    try {
        await axios.post('users/forget-password', {email});
        toast.success('Email Sent');
        return true;
    } catch (error) {
        toast.error((error as any).response.data.error);
    }
    return false;
};

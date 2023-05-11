import toast from "react-hot-toast";
import { axios } from "../../lib/axios";

declare const google: any;

export const login = async ({email, password}: any) => {
    try {
        let result = await axios.post('sessions', {email, password});
        localStorage.setItem('user', JSON.stringify(result.data));
        return true;
    } catch (error) {
        toast.error((error as any).response.data.error);
    }
    return false;
};

export const loginWithGoogle = () => {
    //
    return new Promise((resolve: any, reject: any) => {
        google.accounts.id.initialize({
            client_id: '848418074758-gbcr381vo4f8i9pdpeqat8ohp6dua2pq.apps.googleusercontent.com',
            callback: async (result: any) => {
                try {
                    let response = await axios.post('sessions/connect-with-social-media', {
                        token: result.credential
                    });
                    localStorage.setItem('user', JSON.stringify(response.data));
                    resolve(true);
                } catch (e) {
                    reject(e)
                }
            }
        });
        google.accounts.id.prompt();
    })

}

import { FC } from "react";
import { useUpdateWebToken } from "../model/hooks";
import { Welcome } from "./Welcome";

type SignInProps = {
    children: React.ReactNode;
};

export const SignIn: FC<SignInProps> = ({ children }) => {
    const { data: webToken } = useUpdateWebToken();

    const signedIn: boolean = !webToken || !webToken.error;

    return <>{signedIn ? children : <Welcome />}</>;
};

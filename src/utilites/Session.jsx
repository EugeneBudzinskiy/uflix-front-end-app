import React, { useCallback, useContext, useState } from "react";
import { useApi } from "./ApiProvider.tsx";
import useSessionTokenManager from "./useSessionTokenManager";
import { NotificationManager } from "react-notifications";

const SessionContext = React.createContext();

const Session = ({ children }) => {
    const { writeToken, clearToken, fetchToken, 
            writeUserID, clearUserID } = useSessionTokenManager();
    const [hasLoadedSession, setHasLoadedSession] = useState(false);
    const api = useApi();
    const [user, setUser] = useState();

    function refreshPage() {
        window.location.reload();
    }

    const isAuthenticated = () => {
        return !!fetchToken();
    };

    const apiErrorHandler = (err) => {
        if (err && err.response && err.response.data && err.response.status >= 400) {
            NotificationManager.error("Something went wrong Please Check Your data or call to support", `ERROR ${err.response.status}`);
            return Promise.reject(err)
        }
    };

    const handleSession = useCallback((response) => {

        if (response.data.access) {
            const jwt = response.data.access;
            writeToken(jwt);
            writeUserID(response.data.id);
        }

        const newUser = { ...response.data };
        setUser(newUser);
        return response.data;
    }, [writeToken, writeUserID, setUser]);

    const signup = ({ name, email, password }) => {
        const authApi = api;
        return authApi.post(
                "/signup/",
                {
                    "name": name,
                    "email": email,
                    "password": password, 
                },
            )
            .then(handleSession)
            .then(() => setHasLoadedSession(true))
            // .then(() => refreshPage())
            .catch(apiErrorHandler);
    };

    const login = ({ email, password }) => {
        const authApi = api;
        return authApi
            .post(
                "/login/",
                {   
                    email: email,
                    password: password,   
                },
            )
            .then(handleSession)
            .then(() => setHasLoadedSession(true))
            // .then(() => refreshPage())
            .catch(apiErrorHandler);
    };

    const logout = () => {
        setUser(null);
        clearToken();
        clearUserID();
        refreshPage()
        return user
    };

    return (
        <SessionContext.Provider
            value={{
                user,
                isAuthenticated,
                login,
                logout,
                hasLoadedSession,
                writeToken,
                setUser,
                signup,
                refreshPage,
            }}
        >
            { children }
        </SessionContext.Provider>
    );
};

export default Session;

export const useSession = () => {
    const context = useContext(SessionContext);
    if (typeof context === "undefined") {
        throw new Error("useSession must be used within a SessionContext");
    }
    return context;
};

import React, { useState } from "react";
import "../App.css";
import { apiOrigin } from "../services/support";

interface SidebarProps {
    token: string;
    email: string;
}

interface UserData {
    user: {
        ID: string;
    };
}

export const Sidebar: React.FC<SidebarProps> = ({ token, email }) => {
    const [, /*userId*/ setUserId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    interface ApiResponse {
        // Define properties according to your API response structure
        // For example:
        data: {
            // Define properties based on your API response
            // For example:
            userId: string;
        };
    }

    const fetchData = async (): Promise<string | null> => {
        if (!email || !token) {
            setError("Email or token is missing.");
            return null;
        }

        try {
            const url = `${apiOrigin}/admin/user?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const userDataResponse = (await response.json()) as UserData;
            const fetchedUserId = userDataResponse.user.ID;
            if (!fetchedUserId) {
                throw new Error("User ID not found in response");
            }
            setUserId(fetchedUserId);
            setError(null);
            return fetchedUserId;
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(
                error instanceof Error && typeof error.message === "string"
                    ? error.message
                    : "An unexpected error occurred",
            );

            setTimeout(() => {
                setError(null);
            }, 1000);
            return null;
        }
    };

    const performAction = async (userId: string, action: string) => {
        try {
            const actionUrls: Record<string, string> = {
                Disable2FA: "/admin/user/disable-2fa",
                Passkeys: "/admin/user/disable-passkeys",
                Closefamily: "/admin/user/close-family",
            };

            const url = `${apiOrigin}${actionUrls[action]}?id=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                throw new Error(
                    `Network response was not ok: ${response.status}`,
                );
            }

            const result = (await response.json()) as ApiResponse;
            console.log("API Response:", result);

            // Set success message
            setMessage(`${action} completed successfully`);
            setError(null); // Clear any previous errors

            // Clear success message after 3 seconds
            setTimeout(() => {
                setMessage(null);
            }, 1000);
        } catch (error) {
            console.error(`Error ${action}:`, error);
            setError(
                error instanceof Error && typeof error.message === "string"
                    ? error.message
                    : "An unexpected error occurred",
            );
            // Clear error message after 3 seconds
            setTimeout(() => {
                setError(null);
            }, 1000);
            setMessage(null); // Clear message on error
        }
    };

    const handleActionClick = async (action: string) => {
        try {
            const fetchedUserId = await fetchData();
            if (!fetchedUserId) {
                throw new Error("Incorrect email id or token");
            }

            // Perform action
            await performAction(fetchedUserId, action);
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            setError(
                error instanceof Error && typeof error.message === "string"
                    ? error.message
                    : "An unexpected error occurred",
            );
            // Clear error message after 3 seconds
            setTimeout(() => {
                setError(null);
            }, 1000);
            setMessage(null); // Clear message on error
        }
    };

    return (
        <div className="sidebar">
            <div className="button-container">
                <button
                    onClick={() => {
                        handleActionClick("Disable2FA").catch((e: unknown) =>
                            console.error(e),
                        );
                    }}
                >
                    Disable 2FA
                </button>
                <button
                    onClick={() => {
                        handleActionClick("Closefamily").catch((e: unknown) =>
                            console.error(e),
                        );
                    }}
                >
                    Close Family
                </button>
                <button
                    onClick={() => {
                        handleActionClick("Passkeys").catch((e: unknown) =>
                            console.error(e),
                        );
                    }}
                >
                    Disable Passkeys
                </button>
            </div>
            {(error ?? message) && (
                <div className={`message ${error ? "error" : "success"}`}>
                    {error ? `Error: ${error}` : `Success: ${message}`}
                </div>
            )}
        </div>
    );
};

export default Sidebar;

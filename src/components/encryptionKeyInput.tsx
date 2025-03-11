import { Input } from "./ui/input";
import { useState, useEffect } from "react";

function isKeyValid(key: string): boolean {
    return key === "" || (key.length === 32 && /^[a-zA-Z0-9]+$/.test(key));
}

export function EncryptionKeyInput() {
    const [key, setKey] = useState<string>(() => {
        return localStorage.getItem("masterKey") || "";
    });

    const [isValid, setIsValid] = useState<boolean>(() => {
        const storedKey = localStorage.getItem("masterKey") || "";
        return isKeyValid(storedKey);
    });

    useEffect(() => {
        if (isKeyValid(key)) {
            localStorage.setItem("masterKey", key);
            setIsValid(true);
        } else {
            setIsValid(false);
        }
    }, [key]);

    return (
        <div className="space-y-1">
            <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter preset encryption key (leave empty for a random key)"
                type="password"
                maxLength={32}
                className={!isValid ? "border-red-500 focus:ring-red-500" : ""}
            />
            {!isValid && (
                <p className="text-sm text-red-500">
                    Key must be exactly 32 characters long and contain only letters and numbers
                </p>
            )}
        </div>
    );
}
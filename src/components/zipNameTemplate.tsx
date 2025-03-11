import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

function isKeyValid(key: string): boolean {
    return key === "" || /[%@$\w\-_. ]+$/g.test(key);
}

export function OutputZipName() {
    const [key, setKey] = useState<string>(() => {
        return localStorage.getItem("zipNameTemplate") || "";
    });

    const [isValid, setIsValid] = useState<boolean>(() => {
        const storedKey = localStorage.getItem("zipNameTemplate") || "";
        return isKeyValid(storedKey);
    });

    useEffect(() => {
        if (isKeyValid(key)) {
            localStorage.setItem("zipNameTemplate", key);
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
                placeholder="Enter output file name (emtpy for a generated one)"
                maxLength={255}
                className={!isValid ? "border-red-500 focus:ring-red-500" : ""}
            />
            <TooltipProvider>
                <Tooltip>
                    <div className="flex gap-1">
                        <p className="text-sm text-gray-500">You can use</p>
                        <TooltipTrigger>
                            <p className="text-sm text-gray-500 underline">formating codes</p>
                        </TooltipTrigger>
                        <p className="text-sm text-gray-500">to add dynamic values to the output name</p>
                    </div>
                    <TooltipContent>
                        <ul>
                            <li><strong>%pack_name%</strong> - The name of the pack</li>
                            <li><strong>%date%</strong> - The current date in a readable format</li>
                            <li><strong>%time%</strong> - The current time in a readable format</li>
                        </ul>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            {!isValid && (
                <p className="text-sm text-red-500">
                    The file name can only contain valid characters
                </p>
            )}
        </div>
    );
}

export function asFormatedString(str: string, { packName }: { packName: string }) {
    return str
        .replace("%pack_name%", packName)
        .replace("%date%", new Date().toLocaleDateString().replace(/\./g, "_"))
        .replace("%time%", (new Date().toLocaleTimeString()).replace(/:/g, "_"))
}
﻿import { MemoryFileCacheSingleType } from "./memory-file-cache";
import { IDataPackage } from "./data-package";
import config from "./server-config";
import exitHook = require("exit-hook");
import path = require("path");
import IOTAWriter from "../cmds/IOTAWriter";

const pkgFileCacheId = "package.cache";
const writerFileCacheId = "iotaWriter.cache";

export const packageCache = new MemoryFileCacheSingleType<IDataPackage>(config.pacakgeCacheSeconds, true);
export const writersCache = new MemoryFileCacheSingleType<IOTAWriter>(config.iotaWriterStateCacheSeconds, false); //it's importanted, becasue the writer will update its internal mamstatus to track the last address

packageCache.loadFromFile(config.dataFolder, pkgFileCacheId);
writersCache.loadFromFile(config.dataFolder, writerFileCacheId, writer => {
    const json = IOTAWriter.toJsonData(writer);
    if (!json) {
        return undefined;
    }
    return new IOTAWriter(json.iotaProvider, json.seed, json.lastUsedAddress);
});

//save package information memory cache to file, this is fix for hosting on IISNode, which will terminate the nodejs application where no request for a while
exitHook(() => {
    packageCache.saveToFile(config.dataFolder, pkgFileCacheId);
    writersCache.saveToFile(config.dataFolder, writerFileCacheId);
});

//every 3 minutes to save the cache, as IISNode terminate the nodejs process won't trigger exitHook
setInterval(() => {
    packageCache.saveToFile(config.dataFolder, pkgFileCacheId);
    writersCache.saveToFile(config.dataFolder, writerFileCacheId);
}, 1000 * 60 * 3);

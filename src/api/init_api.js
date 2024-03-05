import express from "express";
import cors from "cors";
import bindCrudApi from "./crud.js";
import errorHandler from "./middleware/error_handler.js";

function initApi(app) {
  const server = express();
  server.use(express.json());
  server.use(cors());

  // server.use(logger)
  // server.use(rateLimiter)

  const crudRouter = bindCrudApi(app);
  // const authRouter = bindAuthApi(app);
  // const ddlRouter = bindDdlApi(app);

  server.use("/api", crudRouter);
  // server.use("/api", authRouter);
  // server.use("/api", ddlRouter);

  //Catch All Error Handler
  server.use(errorHandler);

  return server;
}

export default initApi;
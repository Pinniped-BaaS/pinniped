import Pinniped from "./src/Pinniped/Pinniped.js";

const app = Pinniped();

// Extensibility Invocations

// add custom routes
app.addRoute("GET", "/custom", (req, res, next) => {
  res.json({ custom: "elephant seals" });
});

// add event-driven functionality
app.onGetAllRows().add((event) => {
  console.log("Triggered event");
  console.log(event);
});

app.start(3000);

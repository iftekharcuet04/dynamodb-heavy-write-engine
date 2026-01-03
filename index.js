const express = require('express');


const app = express();
app.use(express.json());

const userRouter = require('./src/route');

app.use('/api/users', userRouter);


app.listen(3000, () => console.log("App running on 3000"));
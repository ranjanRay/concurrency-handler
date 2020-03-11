# concurrency-handler
This is a granular concurrency handler. This handler doesn't allow concurrent requests that are received to modify a set of overlapping data.

If the requests do not attempt to work on shared data, they are allowed to execute concurrently.

A Post API is exposed to hit concurrent requests, viz. '/execute-async-operation/`timeout`'. A sample json body would be something as shown below:
{
	"data": ["1", "2"]
}

The "data" in the request body should be an array of strings/ numbers. The API internally executes an async operation for as long as the `timeout` is specified in milliseconds.

Steps to build and execute:

1. Clone the repo.
2. npm i
3. npm run build
4. npm run start
5. The app runs on port 4040

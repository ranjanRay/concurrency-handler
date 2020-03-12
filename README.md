# concurrency-handler
This handler doesn't allow concurrent requests to modify a set of overlapping data.

If the requests do not attempt to work on shared data, they are allowed to execute concurrently.

A Post API is exposed to hit concurrent requests, viz. '/execute-async-operation/`timeout`'. A sample json body would be something as shown below:
{
	"data": ["1", "2"]
}

The "data" in the request body should be an array of strings/ numbers. The API internally executes an async operation for as long as the `timeout` is specified in milliseconds.

Steps to build and execute:

1. Clone the repo.
2. cd to 'concurrency-handler' directory.
3. npm i
4. npm run build
5. npm run start
6. The app runs on port 4040

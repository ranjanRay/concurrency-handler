# just-4-u
This is a granular concurrency handler. This handler doesn't allow concurrent requests are received to modify a set of overlapping data.
If the requests do not attempt to work on shared data, they are allowed to execute concurrently.

A Post API is exposed to hit concurrent requests, viz. `/execute-test`. A sample json body would be something as shown below:
{
	"data": ["1", "2"]
}

The "data" in the request body should be an array of strings/ numbers. The API internally simulates an async operation by executing setTimeout(), thereby creating room for multiple requests to be sent to it.

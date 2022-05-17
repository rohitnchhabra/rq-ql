/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  useMutation,
} from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { request, gql } from 'graphql-request';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from 'react-router-dom';
const endpoint = 'https://graphqlzero.almansi.me/api';

const queryClient = new QueryClient();

function App() {
  const [postId, setPostId] = React.useState(-1);

  return (
    <QueryClientProvider client={queryClient}>
      <p>
        As you visit the posts below, you will notice them in a loading state
        the first time you load them. However, after you return to this list and
        click on any posts you have already visited again, you will see them
        load instantly and background refresh right before your eyes!{' '}
        <strong>
          (You may need to throttle your network speed to simulate longer
          loading sequences)
        </strong>
      </p>
      <BrowserRouter>
        <Routes>
          {/* <Route
            path='post/update/:id'
            element={<Post setPostId={setPostId} />}
          /> */}
          <Route path='post/:id' element={<Post setPostId={setPostId} />} />
          <Route index element={<Posts setPostId={setPostId} />} />
        </Routes>
      </BrowserRouter>
      {/* {postId > -1 ? (
        <Post postId={postId} setPostId={setPostId} />
      ) : (
        <Posts setPostId={setPostId} />
      )} */}
      <ReactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  );
}

function usePosts() {
  return useQuery(
    'posts',
    async () => {
      const {
        posts: { data },
      } = await request(
        endpoint,
        gql`
          query {
            posts {
              data {
                id
                title
              }
            }
          }
        `
      );
      return data;
    },
    {
      // refetchOnWindowFocus: false
    }
  );
}

function Posts({ setPostId }) {
  // let navigate = useNavigate();
  const queryClient = useQueryClient();
  const { status, data, error, isFetching } = usePosts();

  return (
    <div>
      <h1>Posts</h1>
      <div>{isFetching ? 'Background Updating...' : ' '}</div>
      <div>
        {status === 'loading' ? (
          'Loading...'
        ) : status === 'error' ? (
          <span>Error: {error.message}</span>
        ) : (
          <>
            <div>
              {data.map((post) => (
                <p key={post.id}>
                  <Link
                    // onClick={() => setPostId(post.id)}
                    to={`/post/${post.id}`}
                    // style={
                      // We can find the existing query data here to show bold links for
                      // ones that are cached
                    //   queryClient.getQueryData(['post', post.id])
                    //     ? {
                    //         fontWeight: 'bold',
                    //         color: 'green',
                    //       }
                    //     : {}
                    // }
                  >
                    {post.title}
                  </Link>
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function usePost(postId) {
  return useQuery(
    ['post', postId],
    async () => {
      const { post } = await request(
        endpoint,
        gql`
        query {
          post(id: ${postId}) {
            id
            title
            body
          }
        }
        `
      );

      return post;
    },
    {
      // refetchOnWindowFocus: false,
      refetchOnMount: false,
      // staleTime: 5*60*1000,
      enabled: !!postId,
    }
  );
}

function useUpdatePost() {
  return useMutation(async (v) => {
    console.log(v, 'v');
    const { post } = await request(
      endpoint,
      gql`
        mutation ($id: ID!, $input: UpdatePostInput!) {
          updatePost(id: $id, input: $input) {
            id
            body
          }
        }
      `,
      v
    );

    return post;
  });
}

function Post({ setPostId }) {
  let { id: postId } = useParams();
  let navigate = useNavigate();
  const { status, data, error, isFetching, refetch } = usePost(postId);
  const { isLoading: isUpdating, mutate } = useUpdatePost();

  const handleUpdate = () => {
    refetch();
  };

  return (
    <div>
      <div>
        <button onClick={() => navigate(-1)} >
          Back
        </button>
      </div>
      <Link
        // onClick={() => setPostId(post.id)}
        to={`/post/update/2`}
      >
        Go to
      </Link>
      <button
        onClick={() => {
          mutate(
            {
              id: postId,
              input: {
                body: 'Celestial - Some updated content.',
              },
            },
            {
              onSuccess: handleUpdate,
            }
          );
        }}
      >
        Update Post
      </button>
      {isUpdating ? <div>Updating ho rha h</div> : null}
      {!postId || status === 'loading' ? (
        'Loading...'
      ) : status === 'error' ? (
        <span>Error: {error.message}</span>
      ) : (
        <>
          <h1>{data.title}</h1>
          <div>
            <p>{data.body}</p>
          </div>
          <div>{isFetching ? 'Background Updating...' : ' '}</div>
        </>
      )}
    </div>
  );
}

export default App;

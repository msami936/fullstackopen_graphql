import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { ApolloProvider } from '@apollo/client/react'
import { createClient } from 'graphql-ws'
import { Kind, OperationTypeNode } from 'graphql'
import App from './App.jsx'

const authLink = new SetContextLink((prevContext) => {
  const token = localStorage.getItem('library-user-token')
  return {
    headers: {
      ...prevContext.headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const httpLink = new HttpLink({ uri: 'http://localhost:4000' })

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000',
  }),
)

const splitLink = ApolloLink.split(
  ({ query }) => {
    const definition = query.definitions.find(
      (def) => def.kind === Kind.OPERATION_DEFINITION,
    )

    return definition?.operation === OperationTypeNode.SUBSCRIPTION
  },
  wsLink,
  ApolloLink.from([authLink, httpLink]),
)

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StrictMode>,
)

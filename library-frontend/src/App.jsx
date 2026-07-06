import { useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import { useSubscription } from '@apollo/client/react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import Recommend from './components/Recommend'
import { ALL_BOOKS } from './components/Books'

const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      title
      author {
        name
      }
      published
      genres
    }
  }
`

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState(null)

  useEffect(() => {
    if (localStorage.getItem('library-user-token')) {
      setToken(localStorage.getItem('library-user-token'))
    }
  }, [])

  useSubscription(BOOK_ADDED, {
    onData: ({ data, client }) => {
      const book = data.data?.bookAdded

      if (!book) {
        return
      }

      window.alert(`New book ${book.title} added`)

      client.refetchQueries({
        include: [ALL_BOOKS],
      })
    },
  })

  const login = (token) => {
    setToken(token)
    setPage('authors')
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('library-user-token')
    setPage('authors')
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {token ? (
          <>
            <button onClick={() => setPage('add')}>add book</button>
            <button onClick={() => setPage('recommend')}>recommend</button>
            <button onClick={logout}>logout</button>
          </>
        ) : (
          <button onClick={() => setPage('login')}>login</button>
        )}
      </div>

      <Authors show={page === 'authors'} token={token} />

      <Books show={page === 'books'} />

      <NewBook show={page === 'add'} />

      <Recommend show={page === 'recommend'} />

      <LoginForm show={page === 'login' && !token} setToken={login} />
    </div>
  )
}

export default App

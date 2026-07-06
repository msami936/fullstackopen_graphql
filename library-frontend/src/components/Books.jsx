import { useState } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

const ALL_BOOKS = gql`
  query allBooks($genre: String) {
    allBooks(genre: $genre) {
      title
      author {
        name
      }
      published
      genres
    }
  }
`

export { ALL_BOOKS }

const Books = (props) => {
  const [genre, setGenre] = useState(null)

  const result = useQuery(ALL_BOOKS, {
    variables: { genre },
  })

  const allBooksResult = useQuery(ALL_BOOKS, {
    variables: { genre: null },
  })

  const selectGenre = (g) => {
    setGenre(g)
    result.refetch({ genre: g })
    allBooksResult.refetch({ genre: null })
  }

  const selectAllGenres = () => {
    setGenre(null)
    result.refetch({ genre: null })
    allBooksResult.refetch({ genre: null })
  }

  if (!props.show) {
    return null
  }

  if (result.loading || allBooksResult.loading) {
    return <div>loading...</div>
  }

  if (result.error || allBooksResult.error || !result.data || !allBooksResult.data) {
    return <div>could not load books</div>
  }

  const genres = [
    ...new Set(allBooksResult.data.allBooks.flatMap((book) => book.genres)),
  ]

  return (
    <div>
      <h2>books</h2>

      {genre && (
        <p>
          in genre <b>{genre}</b>
        </p>
      )}

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {result.data.allBooks.map((b) => (
            <tr key={b.title}>
              <td>{b.title}</td>
              <td>{b.author.name}</td>
              <td>{b.published}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        {genres.map((g) => (
          <button key={g} onClick={() => selectGenre(g)}>
            {g}
          </button>
        ))}
        <button onClick={selectAllGenres}>all genres</button>
      </div>
    </div>
  )
}

export default Books

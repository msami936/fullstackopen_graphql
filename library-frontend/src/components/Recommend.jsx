import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

const ME = gql`
  query {
    me {
      favoriteGenre
    }
  }
`

const ALL_BOOKS = gql`
  query {
    allBooks {
      title
      author {
        name
      }
      published
      genres
    }
  }
`

const Recommend = (props) => {
  const meResult = useQuery(ME, { skip: !props.show })
  const booksResult = useQuery(ALL_BOOKS, { skip: !props.show })

  if (!props.show) {
    return null
  }

  if (meResult.loading || booksResult.loading) {
    return <div>loading...</div>
  }

  if (
    meResult.error ||
    booksResult.error ||
    !meResult.data?.me ||
    !booksResult.data
  ) {
    return <div>could not load recommendations</div>
  }

  const favoriteGenre = meResult.data.me.favoriteGenre
  const books = booksResult.data.allBooks.filter((book) =>
    book.genres.includes(favoriteGenre),
  )

  return (
    <div>
      <h2>recommendations</h2>

      <p>
        books in your favorite genre <b>{favoriteGenre}</b>
      </p>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((b) => (
            <tr key={b.title}>
              <td>{b.title}</td>
              <td>{b.author.name}</td>
              <td>{b.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Recommend

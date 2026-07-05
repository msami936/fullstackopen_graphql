const Author = require('./models/author')
const Book = require('./models/book')

const initialAuthors = [
  { name: 'Robert Martin', born: 1952 },
  { name: 'Martin Fowler', born: 1963 },
  { name: 'Fyodor Dostoevsky', born: 1821 },
  { name: 'Joshua Kerievsky' },
  { name: 'Sandi Metz' },
]

const initialBooks = [
  {
    title: 'Clean Code',
    published: 2008,
    authorName: 'Robert Martin',
    genres: ['refactoring'],
  },
  {
    title: 'Agile software development',
    published: 2002,
    authorName: 'Robert Martin',
    genres: ['agile', 'patterns', 'design'],
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    authorName: 'Martin Fowler',
    genres: ['refactoring'],
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    authorName: 'Joshua Kerievsky',
    genres: ['refactoring', 'patterns'],
  },
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    authorName: 'Sandi Metz',
    genres: ['refactoring', 'design'],
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    authorName: 'Fyodor Dostoevsky',
    genres: ['classic', 'crime'],
  },
  {
    title: 'Demons',
    published: 1872,
    authorName: 'Fyodor Dostoevsky',
    genres: ['classic', 'revolution'],
  },
]

const seedDatabase = async () => {
  if ((await Book.countDocuments()) > 0) {
    return
  }

  const authorDocs = {}

  for (const authorData of initialAuthors) {
    const author = new Author(authorData)
    await author.save()
    authorDocs[authorData.name] = author
  }

  for (const bookData of initialBooks) {
    let author = authorDocs[bookData.authorName]
    if (!author) {
      author = new Author({ name: bookData.authorName })
      await author.save()
      authorDocs[bookData.authorName] = author
    }

    const book = new Book({
      title: bookData.title,
      published: bookData.published,
      author: author._id,
      genres: bookData.genres,
    })
    await book.save()
  }
}

module.exports = { seedDatabase }

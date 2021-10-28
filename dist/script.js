const BASE_URL = 'https://movie-list.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/v1/movies/'
const POSTER_URL = BASE_URL + '/posters/'
const MOVIES_PER_PAGE = 12
const PAGINATOR_PAGE_RADIUS = 2 //The showing page amount will be (2 * R + 1).
const dataPanel = document.querySelector('#data-panel')
const searchForm = document.querySelector('#search-form')
const showingMode = document.querySelector('.showing-mode')
const paginator = document.querySelector('#paginator')
const movies = []
const searchOut = []
let currentMode = 'card'
let currentPage = 1

// Get and show movie data.
axios.get(INDEX_URL).then(response => {
  movies.push(...response.data.results)
  renderPaginator(movies.length)
	renderShowingModeButton(currentMode)
  renderMovieList(getMoviesByPage(1), currentMode)
}).catch(e => console.log(e))

function renderMovieList(data, mode) {
  let rawHTML = ''
	
	switch (mode) {
		// Card mode.
		case 'card':
			data.forEach(item => {
				rawHTML += `
					<div class="col-sm-3">
						<div class="mb-2">
							<div class="card">
								<img class="card-img-top"
									src="${POSTER_URL + item.image}"
									alt="Movie Poster"
								>
								<div class="card-body">
									<h5 class="card-title">${item.title}</h5>
								</div>
								<div class="card-footer">
									<button class="btn btn-primary btn-show-movie"
										data-toggle="modal"
										data-target="#movie-modal"
										data-id="${item.id}">More
									</button>
									<button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
								</div>
							</div>
						</div>
					</div>`
			})
			break
		
		// List mode.
		case 'list':
			rawHTML += '<ul class="list-group w-100">'
			data.forEach(item => {
				rawHTML += `
				<li class="list-group-item d-flex align-items-center justify-content-between flex-wrap">
					<h5 class="card-title">${item.title}</h5>
					<div class="list-btn">
						<button class="btn btn-primary btn-show-movie"
										data-toggle="modal"
										data-target="#movie-modal"
										data-id="${item.id}">More
						</button>
						<button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
					</div>
				</li>`
			})
			rawHTML += '</ul>'
	}
	
	// Set HTML content.
  dataPanel.innerHTML = rawHTML
}

// Showing mode.
showingMode.addEventListener('click', event => {
	const target = event.target
	
	if (target.tagName === 'I') {
		currentMode = target.dataset.mode
		renderShowingModeButton(currentMode)
		renderMovieList(getMoviesByPage(currentPage), currentMode)
	}
})

function renderShowingModeButton(current) {
	const temp = showingMode.children
	
	// Active the highlight effect according to current showing mode.
	for (let i = 0; i < temp.length; i++) {
		if (temp[i].dataset.mode === current) {
			temp[i].style.color = '#ffffff'
			temp[i].style.backgroundColor = '#333333'
		} else {
			temp[i].style.color = '#000000'
			temp[i].style.backgroundColor = '#ffffff'
		}
	}
}

// Button event.
dataPanel.addEventListener('click', event => {
  const target = event.target

  if (target.matches('.btn-show-movie')) {
    // Click 'More' button to show more movie info.
    showMovieModal(target.dataset.id)
  } else if (target.matches('.btn-add-favorite')) {
    // Click '+' button to add favorite movie.
    addToFavorite(Number(target.dataset.id))
  }
})

function showMovieModal(id) {
  const modalTitle = document.querySelector('#movie-modal-title')
  const modalImage = document.querySelector('#movie-modal-image')
  const modalDate = document.querySelector('#movie-modal-date')
  const modalDescription = document.querySelector('#movie-modal-description')

  axios.get(INDEX_URL + id).then(response => {
    const data = response.data.results
    
    modalTitle.innerText = data.title
    modalDate.innerText = 'Release date: ' + data.release_date
    modalDescription.innerText = data.description
    modalImage.innerHTML = `<img src="${POSTER_URL + data.image}" alt="movie-poster" class="img-fluid">`
  })
}

function addToFavorite(id) {
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []

  if (list.some(movie => movie.id === id)) {
    return alert('The movie has been in your favorite list!')
  }

  list.push(movies.find(movie => movie.id === id))
  localStorage.setItem('favoriteMovies', JSON.stringify(list))
  alert('Add successfully!')
}

// Search movie.
searchForm.addEventListener('submit', event => {
  event.preventDefault()
  const keyword = event.target.querySelector('input').value.trim().toLowerCase()
  searchOut.length = 0

  if (keyword.length <= 0) {
		currentPage = 1
    renderPaginator(movies.length)
    renderMovieList(getMoviesByPage(1), currentMode)
    return
  }

  searchOut.push(...searchMovieKeyword(keyword, movies))

  if (searchOut.length <= 0) {
    return alert(`Can't find any movie with keyword "${keyword}"`)
  }
	currentPage = 1
  renderPaginator(searchOut.length)
  renderMovieList(getMoviesByPage(1), currentMode)
})

function searchMovieKeyword(keyword, data) {
  const searchOut = []

  data.forEach(item => {
    if (item.title.toLowerCase().includes(keyword)) {
      searchOut.push(item)
    }
  })

  return searchOut
}

// Paginator
paginator.addEventListener('click', event => {
	event.preventDefault()
  const target = event.target

  if (target.tagName === 'A') {
    const data = searchOut.length ? searchOut : movies
    let fix = 0 //Change if user press "pre" or "next" button.

    if (target.matches('.page-pre')) fix--
    if (target.matches('.page-next')) fix++

    currentPage = Number(target.dataset.page) + fix
    renderPaginator(data.length)
    renderMovieList(getMoviesByPage(Number(target.dataset.page) + fix), currentMode)
  }
})

function renderPaginator(length) {
  const maxPageNum = Math.ceil(length / MOVIES_PER_PAGE)
  const pageNum = PAGINATOR_PAGE_RADIUS * 2 + 1
  let temp = []
  let tempHTML = `
    <li class="page-item">
      <a class="page-link page-pre" href="#" aria-label="Previous" data-page="${currentPage}">&laquo;</a>
    </li>
  `

  // Disable "pre" button if current page is at the start.
  // Using 'data-page="${currentPage}"' to help event listener calculating the page number.
  if (currentPage <= 1) {
    tempHTML = `
      <li class="page-item disabled">
        <a class="page-link page-pre" href="#" aria-label="Previous" data-page="${currentPage}">&laquo;</a>
      </li>`
  }

  if (maxPageNum <= pageNum) {
    // If the actual page amount is less than the setting(according to PAGINATOR_PAGE_RADIUS), showing every pages.
    for (let p = 1; p <= maxPageNum; p++) {
      if (p === currentPage) {
        tempHTML += `<li class="page-item active"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`
      } else {
        tempHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`
      }
    }
  } else {
    let fix = 0 
    // Generate number of showing page.
    for (let i = 0; i < pageNum; i++) {
      temp[i] = currentPage - PAGINATOR_PAGE_RADIUS + i
    }

    // Fix the number if it's out of boundary.
    if (temp[0] < 1) fix = 1 - temp[0]
    if (temp[pageNum - 1] > maxPageNum) fix = maxPageNum - temp[pageNum - 1]

    temp.forEach(item => {
      // Using "active" class according to current page.
      if (item + fix === currentPage) {
        tempHTML += `<li class="page-item active"><a class="page-link" href="#" data-page="${item + fix}">${item + fix}</a></li>`
      } else {
        tempHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${item + fix}">${item + fix}</a></li>`
      }
    })
  }

  // Disable "next" button if current page is at the end.
  if (currentPage >= maxPageNum) {
    tempHTML += `
    <li class="page-item disabled">
      <a class="page-link page-next" href="#" aria-label="Next" data-page="${currentPage}">&raquo;</a>
    </li>`
  } else {
    tempHTML += `
    <li class="page-item">
      <a class="page-link page-next" href="#" aria-label="Next" data-page="${currentPage}">&raquo;</a>
    </li>`
  }

  paginator.innerHTML = tempHTML
}

function getMoviesByPage(page) {
  const data = searchOut.length ? searchOut : movies
  const startId = (page - 1) * MOVIES_PER_PAGE

  return data.slice(startId, startId + MOVIES_PER_PAGE)
}
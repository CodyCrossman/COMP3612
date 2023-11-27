// Constants and Variables
const dataLsKey = "songsData";
const playlistLsKey = "playListSongIds";
let songsData = [];
const genres = [];
const artists = [];
let topGenres = topArtists = popularSongs = filteredSongs = playlistSongIds = [];
let filterField = "title";
let filterValue = "";
let sortField = "title";
let sortDirection = "ASC";
let radarChart;
const goToSearchLink = document.querySelector("header a[data-section='search']");

// Load playlist song IDs from local storage if available
if (localStorage.getItem(playlistLsKey) !== null) {
    playlistSongIds = JSON.parse(localStorage.getItem(playlistLsKey));
}

// Event listener for DOMContentLoaded
document.addEventListener("DOMContentLoaded", (event) => {
    console.log("DOM fully loaded and parsed");

    // Check if song data is available in local storage
    if (localStorage.getItem(dataLsKey) === null) {
        // Fetch data from the remote API if not available
        fetch('https://www.randyconnolly.com/funwebdev/3rd/api/music/songs-nested.php', {})
            .then((response) => response.json())
            .then(data => {
                // Save data to local storage
                localStorage.setItem(dataLsKey, JSON.stringify(data));
                songsData = data;
                loadApp(); // Load the application
            });
    } else {
        // Use the data from local storage
        songsData = JSON.parse(localStorage.getItem(dataLsKey));
        loadApp(); // Load the application
    }
});

// Load Application
const loadApp = () => {
    // Copy the entire songsData array to filteredSongs
    filteredSongs = songsData.concat();

    // Count and organize genres and artists
    songsData.forEach((song) => {
        const genre = song.genre;
        const foundGenreIndex = genres.findIndex(g => g.id === genre.id);
        if (foundGenreIndex === -1) {
            genres.push({...genre, count: 1});
        } else {
            genres[foundGenreIndex].count += 1;
        }

        const artist = song.artist;
        const foundArtistIndex = artists.findIndex(g => g.id === artist.id);
        if (foundArtistIndex === -1) {
            artists.push({...artist, count: 1});
        } else {
            artists[foundArtistIndex].count += 1;
        }
    });

    // Sort genres by count in descending order
    genres.sort((a, b) => b.count - a.count);

    // Append genre options to filter form select
    let genresSelectHtml = "<option value=\"\" selected>Pick one</option>";
    genres.forEach((genre) => {
        genresSelectHtml += `<option value="${genre.id}">${genre.name}</option>`;
    });
    document.querySelector("#filterForm select[name='genre-filter']").innerHTML = genresSelectHtml;

    // Append top 15 genre lists to HTML
    topGenres = genres.slice(0, 15);
    let topGenresHtml = "";
    topGenres.forEach((genre) => {
        topGenresHtml += `<li><a href="#" class="top-genre" data-id="${genre.id}">${genre.name}</a></li>`;
    });
    document.querySelector("#topGenres ul").innerHTML = topGenresHtml;

    // Event listener for clicking on a top genre
    document.querySelectorAll('a.top-genre').forEach((element) => {
        element.addEventListener('click', () => {
            const genreId = element.getAttribute('data-id');
            document.querySelector(`input[name='filter'][value='genre']`).click();
            document.querySelector(`#filterForm select[name='genre-filter']`).value = genreId;
            goToSearchLink.click();
        });
    });

    // Append all artist options to filter form select
    artists.sort((a, b) => b.count - a.count);
    let artistsSelectHtml = "<option value=\"\" selected>Pick one</option>";
    artists.forEach((genre) => {
        artistsSelectHtml += `<option value="${genre.id}">${genre.name}</option>`;
    });
    document.querySelector("#filterForm select[name='artist-filter']").innerHTML = artistsSelectHtml;

    // Append top 15 artist lists to HTML
    topArtists = artists.slice(0, 15);
    let topArtistsHtml = "";
    topArtists.forEach((artist) => {
        topArtistsHtml += `<li><a href="#" class="top-artist" data-id="${artist.id}">${artist.name}</a></li>`;
    });
    document.querySelector("#topArtists ul").innerHTML = topArtistsHtml;

    // Event listener for clicking on a top artist
    document.querySelectorAll('a.top-artist').forEach((element) => {
        element.addEventListener('click', () => {
            const artistId = element.getAttribute('data-id');
            document.querySelector(`input[name='filter'][value='artist']`).click();
            document.querySelector(`#filterForm select[name='artist-filter']`).value = artistId;
            goToSearchLink.click();
        });
    });

    // Append top 15 songs to HTML
    songsData.sort((a, b) => b.details.popularity - a.details.popularity);
    popularSongs = songsData.slice(0, 15);
    let popularSongsHtml = "";
    popularSongs.forEach((song) => {
        popularSongsHtml += `<li><a href="#" class="go-to-song" data-id="${song.song_id}">${song.title}</a></li>`;
    });
    document.querySelector("#popularSongs ul").innerHTML = popularSongsHtml;
    registerGoToSongEvent(); // Register event for clicking on a song
    const filterForm = document.getElementById('filterForm');

    // Event listener for filtering songs
    filterForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(filterForm);
        filterField = formData.get("filter");
        filterValue = formData.get(`${filterField}-filter`);
        searchSongs(); // Search and filter songs based on user input
    });

    // Event listener for resetting filter
    filterForm.addEventListener("reset", (event) => {
        filterField = "title";
        filterValue = "";
        document.querySelector(`#filterForm input[type='radio'][value='title']`).click();
        searchSongs(); // Reset and show all songs
    });
}

// Navigation links in the header
document.querySelectorAll("header a[data-section]").forEach((sectionLink) => {
    // Event listener for clicking on a section link
    sectionLink.addEventListener('click', (event) => {
        const sectionId = sectionLink.getAttribute('data-section');
        document.querySelectorAll(`main > section[id]`).forEach((section) => {
            section.classList.add('d-none');
        });
        document.querySelector(`main section[id='${sectionId}']`).classList.remove('d-none');
    });
});

// Event listener for clicking on the search link
goToSearchLink.addEventListener('click', () => {
    document.querySelector("#filterForm input[type=submit]").click();
});

// Event listener for clicking on the playlist link
document.querySelector(`a[data-section='playlist']`).addEventListener('click', () => {
    // Generate filtered songs HTML and render playlist table
    renderPlaylistTable();
});

// Render playlist table
const renderPlaylistTable = () => {
    // Filter songs that are in the playlist
    const playlistSongs = songsData.filter((song) => playlistSongIds.indexOf(song.song_id) !== -1);
    let playlistSongsHtml = "";

    // Generate HTML for each song in the playlist
    playlistSongs.forEach((song) => {
        playlistSongsHtml += `<tr>
            <td>
            <a href="#" class="go-to-song" data-id="${song.song_id}"  title="${song.title}">${song.title}</a>
            </td>
            <td>${song.artist.name}</td>
            <td>${song.year}</td>
            <td>${song.genre.name}</td>
            <td><button class="remove-from-playlist button" data-id="${song.song_id}">Remove</button></td>
        </tr>`;
    });

    // Update the playlist table in the HTML
    document.querySelector("#playlistTable tbody").innerHTML = playlistSongsHtml;
    registerGoToSongEvent(); // Register event for clicking on a song in the playlist

    // Update playlist statistics (number of songs, average popularity)
    const playlistSongsNum = playlistSongs.length;
    document.getElementById('playlistSongsNum').innerHTML = playlistSongsNum;
    document.getElementById('averagePlaylistPopularity').innerHTML = (playlistSongs.reduce(
        (sum, song) => sum + song.details.popularity, 0) / playlistSongsNum).toFixed(0);

    // Event listener for removing a song from the playlist
    document.querySelectorAll(".remove-from-playlist").forEach(element => {
        element.addEventListener('click', () => {
            const selectedSongId = element.getAttribute('data-id') * 1;

            // Remove the selected song from the playlist
            playlistSongIds = playlistSongIds.filter((id) => id !== selectedSongId);

            // Show a notification box
            document.getElementById('box2').classList.add('tn-box-active');
            setTimeout(() => {
                document.getElementById('box2').classList.remove('tn-box-active');
            }, 2 * 1000);

            setPlaylistSongIds(); // Update playlist song IDs in local storage
            renderPlaylistTable(); // Render the updated playlist table
        });
    });
};

// Function to search and filter songs based on user input
const searchSongs = () => {
    console.log(`filterField: ${filterField}, filterValue: ${filterValue}`);
    
    // Sort songs based on the selected sortField and sortDirection
    filteredSongs = songsData.concat();
    filteredSongs.sort((a, b) => {
        if (sortField !== "year") {
            // Sort alphabetically for title, artist, and genre
            let mA, mB;
            switch (sortField) {
                case "title":
                    mA = a.title;
                    mB = b.title;
                    break;
                case "artist":
                    mA = a.artist.name;
                    mB = b.artist.name;
                    break;
                case "genre":
                    mA = a.genre.name;
                    mB = b.genre.name;
                    break;
            }
            mA = mA.toUpperCase();
            mB = mB.toUpperCase();
            if (mA < mB) {
                return sortDirection === "ASC" ? -1 : 1;
            }
            if (mA > mB) {
                return sortDirection === "ASC" ? 1 : -1;
            }
            return 0;
        } else {
            // Sort numerically for the year
            return sortDirection === "ASC" ? a.year - b.year : b.year - a.year;
        }
    });

    // Filter songs based on user input
    let songsHtml = "";
    if (filterField && filterValue) {
        switch (filterField) {
            case "title":
                filteredSongs = filteredSongs.filter((song) => song.title.includes(filterValue));
                break;
            case "artist":
                filteredSongs = filteredSongs.filter((song) => song.artist.id === filterValue * 1);
                break;
            case "genre":
                filteredSongs = filteredSongs.filter((song) => song.genre.id === filterValue * 1);
                break;
        }
    }

    // Generate HTML for filtered songs
    filteredSongs.forEach((song) => {
        songsHtml += `<tr>
            <td>
            <a href="#" class="go-to-song" data-id="${song.song_id}"  title="${song.title}">${song.title}</a>
            <td>${song.artist.name}</td>
            <td>${song.year}</td>
            <td>${song.genre.name}</td>
            <td><button class="add-to-playlist button" data-id="${song.song_id}">Add</button></td>
        </tr>`;
    });

    // Update the search results table in the HTML
    document.querySelector("#searchResults tbody").innerHTML = songsHtml;
    registerGoToSongEvent(); // Register event for clicking on a song in the search results

    // Event listener for adding a song to the playlist
    document.querySelectorAll(".add-to-playlist").forEach(element => {
        element.addEventListener('click', () => {
            const selectedSongId = element.getAttribute('data-id') * 1;
            if (playlistSongIds.indexOf(selectedSongId) === -1) {
                playlistSongIds.unshift(selectedSongId);
                document.getElementById('box1').classList.add('tn-box-active');
                setTimeout(() => {
                    document.getElementById('box1').classList.remove('tn-box-active');
                }, 2 * 1000);
                setPlaylistSongIds(); // Update playlist song IDs in local storage
            }
        });
    });
}

// Event listener for clicking on sortable elements in the table header
const sortElements = document.querySelectorAll("th.sorting");
sortElements.forEach((element) => {
    element.addEventListener('click', () => {
        // Update sorting criteria based on user click
        sortField = element.getAttribute("data-field");
        document.querySelectorAll(`th.sorting:not([data-field='${sortField}'])`).forEach((param) => {
            param.classList.remove('sorting-asc');
            param.classList.remove('sorting-desc');
        });
        if (element.classList.contains('sorting-asc')) {
            sortDirection = "DESC";
            element.classList.remove('sorting-asc');
            element.classList.add('sorting-desc');
        } else {
            sortDirection = "ASC";
            element.classList.remove('sorting-desc');
            element.classList.add('sorting-asc');
        }
        searchSongs(); // Trigger song search with the new sorting criteria
    });
});

// Disable/enable input and select elements based on radio selection
document.querySelectorAll('#filterForm input[type=radio]').forEach(element => {
    element.addEventListener("click", () => {
        document.querySelectorAll(`[name='title-filter'], select`).forEach(param => {
            param.disabled = true;
        });
        document.querySelector(`[name='${element.value}-filter']`).disabled = false;
    });
});

// Event listener for clearing the playlist
document.querySelector('#clearPlaylist').addEventListener('click', () => {
    playlistSongIds = [];
    setPlaylistSongIds(); // Update playlist song IDs in local storage
    renderPlaylistTable(); // Render the updated playlist table
});

// Function to set playlist song IDs in local storage
const setPlaylistSongIds = () => {
    localStorage.setItem(playlistLsKey, JSON.stringify(playlistSongIds));
}

// Function to register the event for clicking on a song in the playlist
const registerGoToSongEvent = () => {
    document.querySelectorAll('.go-to-song').forEach((element) => {
        element.addEventListener('click', () => {
            const singleSongId = element.getAttribute("data-id") * 1;

            // Show the details section and hide other sections
            document.querySelectorAll(`main > section[id]`).forEach((section) => {
                section.classList.add('d-none');
            });
            document.querySelector(`main section[id='singleSong']`).classList.remove('d-none');

            // Retrieve and display information about the selected song
            const song = songsData.find((song) => song.song_id === singleSongId);
            const songDuration = song.details.duration;
            const songDurationSecs = songDuration % 60;
            const songDurationMinutes = (songDuration - songDurationSecs) / 60;
            document.getElementById('mainInfo').innerHTML = `${song.title}, ${song.artist.name}, ${song.genre.name}, ${song.year}, ${songDurationMinutes}:${songDurationSecs}`;
            ["bpm", "popularity"].forEach((key) => {
                document.getElementById(key).innerHTML = song.details[key];
            });

            // Display analytics information in a radar chart
            const analyticsKeys = ["energy", "danceability", "liveness", "valence", "acousticness", "speechiness"];
            const analyticsValues = [];
            analyticsKeys.forEach((key) => {
                const val = song.analytics[key];
                document.getElementById(key).innerHTML = val;
                analyticsValues.push(val);
            });

            // Create or update the radar chart
            if (radarChart) radarChart.destroy();
            radarChart = new Chart(
                document.getElementById('radarChart'),
                {
                    type: 'radar',
                    options: {
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    },
                    data: {
                        labels: analyticsKeys,
                        datasets: [
                            {
                                data: analyticsValues,
                                pointBackgroundColor: '#DE864D',
                                borderJoinStyle: 'round',
                            }
                        ]
                    }
                }
            );
        });
    });
}

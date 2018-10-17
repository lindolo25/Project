(function () {

    // Initializing Firebase
    var config = {
        apiKey: "AIzaSyDWNTFKKi83a4Rrnk7a1OKKQVchORtBzkw",
        authDomain: "project-ea997.firebaseapp.com",
        databaseURL: "https://project-ea997.firebaseio.com",
        projectId: "project-ea997",
        storageBucket: "project-ea997.appspot.com",
        messagingSenderId: "243720434672"
    };
    firebase.initializeApp(config);


    // Initializing Global variables
    var db = firebase.firestore();
    var email = '';
    var password = '';
    var accesKey = '61dba37b9b408d3f7398562fd07931239ef3c16e7c047cba031df248d53abc9f';
    var secretKey = 'ec7f1958dbb9a421b5bec788a38be943103df4fed1bca7df21ebd6a523b5b1d8';
    const endPoint = 'https://api.unsplash.com/search/photos';
    var image;
    var id;
    var divImage;
    var fovoriteButton;
    var photoURL = '';
    var query = "";
    var url = "";
    limit = "&limit=1"
    var logged = localStorage.getItem("logged");



    //   -------------------------------------------------------------------------------  
    document.addEventListener('DOMContentLoaded', function () {


        var registeForm = $('#register');
        var singInForm = $('#singIn');
        var mainHtml = $('#main');
        var searchButton = $('#searchButton');
        var logOut = $('#logOut');
        var photosPosition = $('#photosPosition');

        if (logged == 'true') {
            singInForm.hide();
            registeForm.hide();
            mainHtml.show();
        } else {
            singInForm.show();
            registeForm.hide();
            mainHtml.hide();
        }

        // For the side bar 
        $('#sidebarCollapse').on('click', function () {
            $('#sidebar').toggleClass('active');
            $(this).toggleClass('active');
        });

        function logout() {
            firebase.auth().signOut();
            localStorage.setItem("logged", false);
            localStorage.setItem("user", "");
            user = '';
            //firebase.auth.singOut();
            singInForm.show();
            registeForm.hide();
            mainHtml.hide();
        }


        searchButton.on('click', function (event) {
            event.preventDefault();
            photosPosition.empty();
            query = $('#search').val().trim();
            console.log('Este es el valor de query: ' + query);
            $.ajax({
                url: endPoint + '?query=' + query +
                    '&client_id=' + accesKey,
                method: "GET"
            }).then(function (response) {
                console.log(response.results);
                (response.results).forEach(element => {
                    id = element.id;
                    photoURL = element.urls.small;
                    image = $('<img>');
                    image.attr('src', photoURL);
                    image.attr('class', 'img');
                    console.log(element);
                    divImage = $('<div class="divI">');
                    fovoriteButton = $('<butoon class="btn btn-success imgButton">Favorito</button>');
                    fovoriteButton.attr('value', photoURL)
                    fovoriteButton.append($('<i class="fa fa-star"></i>'));

                    divImage.append(image).append(fovoriteButton)

                    photosPosition.append(divImage);

                });
            })
        })


        logOut.on('click', function () {
            logout();
        })

        //Switching between the Register view and the Sing In view
        $('#singInLink').on('click', () => {
            singInForm.hide();
            registeForm.show();
        })

        //Calling the button for the Sing Up
        $('#submitRegister').on('click', function (event) {
            event.preventDefault();
            email = $('#emailRegister').val().trim();
            password = $('#passwordRegister').val().trim();
            confirmPass = $('#confirm').val().trim();
            if (password === confirmPass) {
                singUp(email, password);
                registeForm.hide();
                singInForm.show();
            } else {
                alert("Passwords Should mach");
            }
        })

        //Calling the button for the Login
        $('#submit').on('click', function (event) {
            event.preventDefault();
            email = $('#email').val().trim();
            password = $('#password').val().trim();
            login(email, password);

        })

        //Function for the Login
        function login(email, password) {
            firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log(error.message);
            });
        }

        //Function for the Sing Up
        function singUp(email, password) {
            firebase.auth().createUserWithEmailAndPassword(email, password).then(() => {
                verifyEmail();
            }).catch(
                (error) => {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    console.log(error.message);
                }
            )
        }
        
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                localStorage.setItem("logged", true);
                localStorage.setItem("user", user);
                singInForm.hide();
                registeForm.hide();
                mainHtml.show();
                // User is signed in.
            } else {
                // No user is signed in.
            }
        });

        function verifyEmail() {
            var user = firebase.auth().currentUser;
            user.sendEmailVerification().then(function () {
                console.log("Enviando Correo");
            }).catch((error) => {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log(error.message);
            })
        }

        db.collection("users").add({
            first: "Ada",
            last: "Lovelace",
            born: 1815
        })
        .then(function(docRef) {
            console.log("Document written with ID: ", docRef.id);
        })
        .catch(function(error) {
            console.error("Error adding document: ", error);
        });

    })
})();
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
    //var db = firebase.firestore();
    var email = '';
    var password = '';
    var accesKey = '61dba37b9b408d3f7398562fd07931239ef3c16e7c047cba031df248d53abc9f';
    var secretKey = 'ec7f1958dbb9a421b5bec788a38be943103df4fed1bca7df21ebd6a523b5b1d8';
    const endPoint = 'https://api.unsplash.com/search/photos';
    var image;
    var id;
    var divImage;
    var favoritoButton;
    var photoURL = '';
    var query = "";
    var url = "";
    limit = "&limit=1"
    var logged = localStorage.getItem("logged");
    var email = localStorage.getItem("email");
    var user;
    var eVerified = localStorage.getItem("eVerified");
    

    //   -------------------------------------------------------------------------------  
    document.addEventListener('DOMContentLoaded', function () {


        var registeForm = $('#register');
        var singInForm = $('#signin');
        var mainHtml = $('#main');
        var searchButton = $('#searchButton');
        var logOut = $('#logOut');
        var photosPosition = $('#photosPosition');
        var searchInput = $('#search');
        registeForm.hide();
        mainHtml.hide();

        if ((logged == 'true' && eVerified == 'true') ) {
            singInForm.hide();
            registeForm.hide();
            mainHtml.show();
        } else {
            singInForm.show();
            registeForm.hide();
            mainHtml.hide();
        }

        
        // Function for to find photos in the api
        function searchFunction(event) {
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
                    favoritoButton = $('<button class="btn  imgButton">Add to Favorito</button>');
                    favoritoButton.attr('value', photoURL);
                    favoritoButton.attr('id', id);
                    favoritoButton.append($('<i class="fa fa-star"></i>'));

                    divImage.append(image).append(favoritoButton)

                    photosPosition.append(divImage);

                });
            })
        }

    

        searchButton.on('click', function(event){
            searchFunction(event);
        } );

        //Switching between the Register view and the Sing In view
        $('#register-link').on('click', () => {
            singInForm.hide();
            registeForm.show();
        })

        //Switching between the Register view and the Sing In view
        $('#signin-link').on('click', () => {
            registeForm.hide();
            singInForm.show();
        })

        //Calling the button for the Register
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

        //Function for the Register
        function singUp(email, password) {
            firebase.auth().createUserWithEmailAndPassword(email, password).then(() => {
                verifyEmail();
                //location.reload();
                email='';
                password='';
            }).catch(
                (error) => {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    console.log(error.message);
                }
            )
        }

        // Para verificar el Email
        function verifyEmail() {
            user = firebase.auth().currentUser;
            user.sendEmailVerification().then(function () {
               console.log("Enviando Correo");
               console.log(user);
           }).catch((error) => {
               var errorCode = error.code;
               var errorMessage = error.message;
               console.log(error.message);
           })
       }

        //Calling the button for the Login
        $('#submit').on('click', function (event) {
            event.preventDefault();
            email = $('#email').val().trim();
            password = $('#password').val().trim();
            login(email, password);

        })

        //Function for the Login
        function login(email, password) {
           var fr = firebase.auth().signInWithEmailAndPassword(email, password).then(
               function(credentials){


               if(credentials.user.emailVerified){
                localStorage.setItem("logged", true);
                localStorage.setItem("email", email);
                localStorage.setItem("user", user);
                
                mainHtml.show();
                singInForm.hide();
               }
               }

            ).catch(function (error) {
               
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log(error.message);
            });
        }

        
        logOut.on('click', function () {
            logout();
        })

        // Funtion for the logout
        function logout() {
            console.log("Log out");
            firebase.auth().signOut();
            localStorage.setItem("logged", false);
            localStorage.setItem("user", "");
            user = '';
            //firebase.auth.singOut();
            singInForm.show();
            registeForm.hide();
            mainHtml.hide();
            photosPosition.empty();
            searchInput = "";
            email = '';
            password = '';
        }


        
        // Observador
        firebase.auth().onAuthStateChanged(function (user) {
            console.log("Email:" + email);
            if (user) {
                
                eVerified = user.emailVerified;
                console.log("Ver si el user esta verificado:" + eVerified);
                localStorage.setItem('eVerified',true);
                // User is signed in.
            } else {
                // No user is signed in.
            }
        });
        

        // Function to add images to favorito
        $('body').on('click','.imgButton',function(){
            //console.log("Esta es la url de la photo" + $(this).attr('value'));
            
            db.collection("favoritos").add({
               
                email: localStorage.getItem('email'),
                url: $(this).attr('value'),
                 id: $(this).attr('id'),
            })
            .then(function(docRef) {
                console.log("Document written with ID: ", docRef.id);
            })
            .catch(function(error) {
                console.error("Error adding document: ", error);
            });
        })

        $('body').on('click','#myFavoritos',function()
        {
            
            db.collection("favoritos").where("email", "==", 'frigsamo@gmail.com').get()
            .then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                // doc.data() is never undefined for query doc snapshots
                console.log(doc.id, " => ", doc.data());
                });
            })
            .catch(function(error) {
                console.log("Error getting documents: ", error);
            });


            // console.log("Esta es la url de la photo" + $(this).attr('value'));
            
            // db.collection("favoritos").get().then(function(querySnapshot) {
            //     querySnapshot.forEach(function(doc) {
            //         // // doc.data() is never undefined for query doc snapshots
            //         // console.log(doc.id, " => ", doc.data());
            //         // // id = element.id;
            //         // // photoURL = element.urls.small;
            //         // // image = $('<img>');
            //         // // image.attr('src', url);
            //         // // image.attr('class', 'img');
            //         // // console.log(element);
            //         // // divImage = $('<div class="divI">');
            //         // // favoritoButton = $('<button class="btn  imgButton">Add to Favorito</button>');
            //         // // favoritoButton.attr('value', photoURL)
            //         // // favoritoButton.append($('<i class="fa fa-star"></i>'));

            //         // // divImage.append(image).append(favoritoButton)

            //         // // photosPosition.append(divImage);
            //     });
            // });
        })

        

    })
})();

Router.configure({
  layoutTemplate: 'layout'
  /*
  load: function() {
    $('html, body').animate({
      scrollTop: 0
    }, 400);
    $('.content').hide().fadeIn(4000);
  }
  */
});

Router.map(function() {
  this.route('mainpage', {path: '/'} );
  this.route('aboutpage', {path: '/about'});
  this.route('pubspage', {path: '/pubs'});
  this.route('cvpage', {path: '/cv'});
});

/* IR capitalizes template names in lookupTemplate(). This suppresses that */
Router.setTemplateNameConverter(function (str) { return str; });

PubsList = new Mongo.Collection('publications');

if (Meteor.isClient) {

  Template.navitems.helpers( {
    activeIfTemplateIs: function(template) {
      return (Router.current() && (template === Router.current().lookupTemplate()))
        ? 'active': '';
    }
  });

  Template.navitems.rendered = function () {
    
    if (!this.rendered) {   
      console.log("client startup");
      var menu = $(".navbar").offset();
      var origOffsetY = 253/* menu.top */;
      console.log("menu = " + menu);
      
      $(window).scroll(function () {
        if ($(window).scrollTop() >= origOffsetY) {
            $(".navbar").addClass('navbar-fixed-top');
            /* $('.content').addClass('menu-padding'); */
        } else {
            $(".navbar").removeClass('navbar-fixed-top');
            /* $('.content').removeClass('menu-padding'); */
        }
      });

      this.rendered = true;
    }
  };

  Template.mainpage.helpers( {
    getPubs: function () {
      // empty braces means return all, 2nd arg is primary/secondary sort 
      return PubsList.find({}, {sort: {year: -1, title: 1}});
    },
    selectedClass: function () {
      var thisId = this._id;
      var selectedPub = Session.get('clickedPub');
      if (this._id == selectedPub) {
        return "selected";
      }
    },
    showSelectedPub: function () {
      var selectedPub = Session.get('clickedPub');
      return PubsList.findOne(selectedPub);
    }
  });

  Template.mainpage.events( {
    'click .publication': function () {
      console.log("click registered");
      Session.set('clickedPub', this._id);
    },
    'click .showButton': function () {
      var selectedPub = Session.get('clickedPub');
      //console.log(selectedPub);
      PubsList.update(selectedPub, {$set: {selected: "yes"}});
    }
  });

  Meteor.startup(function () {
    
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (PubsList.find().count() === 0) {

      // Read pubs from a json file:      
      var data = JSON.parse(Assets.getText('data/publications.json'));

      console.log("Success importing pubs json.");

      data.publications.forEach(function (item, index, array) {
        Meteor.call('insertPub', item.title, item.year, item.venue);
      });
    }
  });

  Meteor.methods({
    'insertPub': function(strTitle, strYear, strVenue) {
      PubsList.insert({
        title: strTitle,
        year: strYear,
        selected: "no",
        venue: strVenue
      });
    }
  });
}

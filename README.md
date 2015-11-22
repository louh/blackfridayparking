`#blackfridayparking`
====================

Crowdsourced photos of “peak parking demand” on the busiest shopping day of the year, from geotagged [tweets](https://twitter.com/search?q=%23blackfridayparking) and instagrams, a project by [Strong Towns](http://www.strongtowns.org). More info for [2015 here](http://www.strongtowns.org/eventspage/2015/11/27/blackfridayparking). (Archived: [2014](http://www.strongtowns.org/journal/2014/11/24/black-friday-parking-2014-event))

View the page at [http://louhuang.com/blackfridayparking/](http://louhuang.com/blackfridayparking/).

### technical details

There is a second repository, [blackfridayparking-scraper](https://github.com/louh/blackfridayparking-scraper), which extracts tweets and Instagram posts tagged with `#blackfridayparking` and inserts it into data tables [hosted on CartoDB](https://lou.cartodb.com/). The process by which it does this should probably be better documented over in that repository since there are few details (such as the answer to the question "how does it filter by date?") that this map remains oblivious to. More on this later.

For Twitter, it looks for tweets that meet these criteria:

- **are hashtagged:** as a basic requirement for filtering for results the post must have the `#blackfridayparking` hashtag.
- **have a photo:** the point is to visualize things, so a photo is required. It is more likely that hashtagged posts without photos are not participating directly but perhaps offering commentary or sending out links, which makes the map of parking lots less useful.
- **are geolocated:** either with precise coordinates, or a [place](https://dev.twitter.com/overview/api/places), which is not as preferred for data collection because it fuzzes results (e.g. if a user puts down a city for her location but not the parking lot she is in). However, as a way to visualize participation I felt it was important to include this information.
- **are not retweets:** these signal boost original tweets but appear as separate tweets, which creates new rows of data, and this skews the visualization. So these are ignored.

For Instagram, we only look for hashtagged and geolocated posts. Photos are assumed to exist because of the nature of the application.

Once the data is stored in CartoDB there is some basic work done on that end to make certain elements of the map work:

- styling markers with CartoCSS
- custom styling for the info windows (popups)

In the future it is likely that much of the functionality we get out of the CartoDB platform can be done with its [basic core client library](https://github.com/CartoDB/cartodb.js/blob/develop/doc/core_api.md), which is about 22kb as opposed to its much more bloated monolithic library (stock `cartodb.js` is about 190kb, and its cousins without jQuery or Leaflet weigh in at about 160kb and 130kb respectively, and there is not a version without both). We could then store all data in one table, filter it via SQL instead of creating separate tables, and keep more of the styling and functionality inside of this body of code instead of on the CartoDB platform -- it would be easier to control all the functionality in one place, like the infowindow template. For 2015 some progress have been made to rely less upon the built-in jQuery or Leaflet libraries bundled inside `cartodb.js` but there are still some intermediary abstractions that are really nice to have but would require custom code to make a full transition. In the meantime, there is already a pretty nice speed boost from this year's refactoring.



### license

MIT

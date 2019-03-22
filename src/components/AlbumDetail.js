import React, {Component} from 'react';
import {Image, Linking, Text, View} from 'react-native';

import Spotify from 'spotify-web-api-js';
import { Font } from 'expo';

import Card from './Card';
import CardSection from './CardSection';
import Button from './Button';

const sp = new Spotify(); // create new spotify api session, later used to make calls

export default class AlbumDetail extends Component {
    constructor() {
        super();

        this.state = {
            fontsLoaded: false,
            album: {
                id: 'album_id',
                name: 'album_name',
                artist: 'artist_name',
                artistID: 'artist_id',
                image: 'image_URL',
                url: 'album_URL'
            },
            artist: {
                thumbnail: 'thumbnail_URL'
            }
        };
    }

    /*
    @randomNum:
        generate random number from 0 to maxNum
    */

    static randomNum(maxNum) {
        return Math.floor(Math.random() * maxNum);
    }

    /*
    @randomChar:
        picks a random character from a-z/0-9 for spotify api search query
    */

    static randomChar() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        return chars.charAt(AlbumDetail.randomNum(chars.length));
    };

    /*
    @fetchRandomAlbum:
         fetches random album from spotify api
         generates random offset; spotify api will then return an album from search query based on that offset number
         fetches 1 album (limit: 1) from the search query of 10000 albums (offset: 0-10000))
         updates current state with new fetched album id
    */

    fetchRandomAlbum = async() => {
        const offset = AlbumDetail.randomNum(10000);
        await sp.searchAlbums(AlbumDetail.randomChar(), {limit: 1, offset: offset, market: 'CZ'})
            .then((response) => {
                this.setState({ album: {
                    id: response.albums.items[0].id,
                    }
                })
            });
        };

    /*
    @fetchAlbum:
        fetches details of previously obtained album from @fetchRandomAlbum()
        updates current state with the fetched details
    */

    fetchAlbum = async() => {
        await sp.getAlbum(this.state.album.id)
            .then((response) => {
                this.setState({ album: {
                        name: response.name,
                        url: response.uri,
                        image: response.images[0].url,
                        artist: response.artists[0].name,
                        artistID: response.artists[0].id
                    }
                });
            });
    };

    /*
    @fetchArtist:
        fetches details about the album's artist
        requires @fetchAlbum() to first update current state with artistID
        then updates 'artist' state with artist thumbnail img url
    */

    fetchArtist() {
        sp.getArtist(this.state.album.artistID)
            .then((response) => {
                this.setState({ artist: {
                        thumbnail: response.images[0].url
                    }
                });
            });
    }

    /*
    @refreshAlbum:
        calls above-defined spotify api calls to generate a new random album onto screen
        also called by the 'RANDOMIFY' button
    */

    refreshAlbum() {
        this.fetchRandomAlbum()
            .then(() => {
                this.fetchAlbum()
                    .then(() => {
                        this.fetchArtist()
                    })
            });
    }

    /*
    @loadFonts:
        loads custom fonts via async call and re-renders screen
    */

    loadFonts = async() => {
        await Font.loadAsync({'aileron-semibold': require('../../assets/fonts/Aileron-SemiBold-webfont.ttf'),});
        await Font.loadAsync({'aileron-light':    require('../../assets/fonts/Aileron-Light-webfont.ttf'),});
        await Font.loadAsync({'aileron-bold':    require('../../assets/fonts/Aileron-Bold-webfont.ttf'),});
        await Font.loadAsync({'aileron-black':    require('../../assets/fonts/Aileron-Black-webfont.ttf'),});
        this.setState({ fontsLoaded: true });
    };

    /*
    @componentDidMount:
        requests access token for spotify api requests upon App launch via @getTokens()
        set access token for active spotify api session (active for 6 minutes)
        load first random album on app launch
    */

    componentDidMount() {
        this.loadFonts();
    }

    componentDidUpdate(prevProps) {
        if (this.props.accessToken !== prevProps.accessToken) {
            console.log('AlbumDetail accessToken: ' + this.props.accessToken);
            sp.setAccessToken(this.props.accessToken);
            this.refreshAlbum()
        }

    }

    render() {
        if(!this.state.fontsLoaded) {
            return (
                <View>
                    <Text>Loading fonts..</Text>
                </View>
            );
        }

        const album = this.state.album;
        const artist = this.state.artist;

        const {
            thumbnailStyle,
            headerContentStyle,
            thumbnailContainerStyle,
            headerTextStyle,
            imageStyle,
            artistTextStyle,
            buttonTextStyle
        } = styles;

        if (album == null) {
            return <View><Text>Loading...</Text></View>;
        }

        return (
            <View>
                <Card>
                    <CardSection>
                        <View style={thumbnailContainerStyle}>
                            <Image
                                style={thumbnailStyle}
                                source={{ uri: artist.thumbnail }}
                            />
                        </View>
                        <View style={headerContentStyle}>
                            <Text style={headerTextStyle}>{album.name}</Text>
                            <Text style={artistTextStyle}>{album.artist}</Text>
                        </View>
                    </CardSection>
                    <CardSection>
                        <Image
                            style={imageStyle}
                            source={{ uri: album.image }}
                        />
                    </CardSection>
                    <CardSection>
                        <Button whenPressed={() => { Linking.openURL(album.url); }}>
                            <Text style={buttonTextStyle}>Listen on Spotify</Text>
                        </Button>
                    </CardSection>
                </Card>

            </View>
        );
    }
}

const styles = {
    headerContentStyle: {
        flexDirection: 'column',
        justifyContent: 'space-around',
    },
    headerTextStyle: {
        maxWidth: 260,
        fontSize: 18,
        fontFamily: 'aileron-semibold',
        color: '#fff',
    },
    artistTextStyle: {
        fontFamily: 'aileron-light',
        color: '#fff'
    },
    thumbnailStyle: {
        height: 50,
        width: 50,
        borderRadius: 50
    },
    thumbnailContainerStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
        marginRight: 10,
        backgroundColor: '#232323'
    },
    imageStyle: {
        height: 335,
        flex: 1,
        width: null,
        borderRadius: 5
    },

    buttonTextStyle: {
        // letterSpacing: 1,
        fontFamily: 'aileron-light',
        alignSelf: 'center',
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        paddingTop: 10,
        paddingBottom: 10
    }
};

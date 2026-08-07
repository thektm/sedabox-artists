export type SongStatus = "draft" | "pending" | "approved" | "rejected" | "published" | "deleted";

export interface ArtistOption {
  id: number;
  name: string;
  name_en?: string;
  artistic_name?: string;
  artistic_name_en?: string;
  profile_image?: string;
}

export interface TaxonomyOption {
  id: number;
  title: string;
  name?: string;
}

export interface SongMetadata {
  id: number;
  title: string;
  title_fa?: string;
  title_en: string;
  artist: string;
  featuredArtists: ArtistOption[];
  featured_artists?: ArtistOption[];
  featured_artist_ids: number[];
  album: string;
  duration: string;
  plays: string;
  status: SongStatus;
  approvalStatus: "approved" | "pending" | "rejected" | "none";
  image: string;
  audioFile?: string;
  audio_file?: File;
  cover_image?: File;
  releaseDate: string;
  release_date?: string;
  genre: string[];
  subGenre: string[];
  mood: string[];
  genre_ids: number[];
  sub_genre_ids: number[];
  mood_ids: number[];
  tag_ids: number[];
  language: string;
  explicit?: boolean;
  tempo: number;
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  liveness: boolean;
  live_performed?: boolean;
  speechiness: number;
  label: string;
  label_en: string;
  producers: string[];
  producers_en: string[];
  composers: string[];
  composers_en: string[];
  lyricists: string[];
  lyricists_en: string[];
  lyrics: string;
  lyrics_en: string;
  tags: string[];
  description: string;
  description_en: string;
  credits: string;
  credits_en: string;
  is_single?: boolean;
  album_id?: number | null;
  album_active_songs_count?: number;
  requires_reapproval?: boolean;
  linked_release_statuses?: string[];
}

export type PartialSong = Partial<SongMetadata>;

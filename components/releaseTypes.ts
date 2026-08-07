import { ArtistOption, SongStatus, TaxonomyOption } from "./types";

export type ReleaseType = "single" | "ep" | "album" | "compilation";
export type ReleaseStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "live"
  | "rejected"
  | "taken_down";

export interface ReleaseContributor {
  id: string;
  name: string;
  name_en?: string;
  roles: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ReleaseIssue {
  section: string;
  message: string;
  track_id?: number;
}

export interface ReleaseValidation {
  valid: boolean;
  errors: ReleaseIssue[];
  warnings: ReleaseIssue[];
  summary: {
    release_information: boolean;
    artwork: boolean;
    track_count: number;
    audio_passed: boolean;
    complete_tracks: number;
    rights_warnings: number;
  };
}

export interface ReleaseTrackExtras {
  isrc?: string;
  version?: string;
  explicit?: boolean;
  publishing_owner?: string;
  preview_start?: number;
}

export interface ReleaseTrackApi {
  id: number;
  title: string;
  title_en?: string;
  artist_name?: string;
  featured_artists?: ArtistOption[];
  featured_artist_ids?: Array<{ id: number; title: string }> | number[];
  album_title?: string | null;
  duration_display?: string;
  duration_seconds?: number;
  original_format?: string;
  cover_image?: string;
  own_cover_image?: boolean;
  audio_file?: string;
  stream_url?: string;
  release_date?: string;
  status?: SongStatus;
  language?: string;
  genre_ids?: TaxonomyOption[];
  sub_genre_ids?: TaxonomyOption[];
  mood_ids?: TaxonomyOption[];
  tag_ids?: TaxonomyOption[];
  tempo?: number;
  energy?: number;
  danceability?: number;
  valence?: number;
  acousticness?: number;
  instrumentalness?: number;
  live_performed?: boolean;
  speechiness?: number;
  label?: string;
  label_en?: string;
  producers?: string[];
  producers_en?: string[];
  composers?: string[];
  composers_en?: string[];
  lyricists?: string[];
  lyricists_en?: string[];
  lyrics?: string;
  lyrics_en?: string;
  description?: string;
  description_en?: string;
  credits?: string;
  credits_en?: string;
  is_single?: boolean;
  has_audio?: boolean;
  metadata_completion: number;
  missing_metadata: string[];
  release_extras: ReleaseTrackExtras;
}

export interface ReleaseMetadata {
  release_date: string;
  original_release_date: string;
  label: string;
  label_en: string;
  p_copyright: string;
  c_copyright: string;
  territories: string[];
  cover_url: string;
  description: string;
  description_en: string;
}

export interface SharedMetadata {
  language: string;
  label: string;
  label_en: string;
  genre_ids: number[];
  sub_genre_ids: number[];
  mood_ids: number[];
  tag_ids: number[];
  producers: string[];
  producers_en: string[];
  composers: string[];
  composers_en: string[];
  lyricists: string[];
  lyricists_en: string[];
}

export interface ArtistRelease {
  id: string;
  legacy?: boolean;
  legacy_kind?: "album" | "song";
  album_id?: number | null;
  song_id?: number | null;
  title: string;
  title_en?: string;
  release_type: ReleaseType;
  previously_released?: boolean;
  primary_artist_id?: number;
  primary_artist?: { id: number; name: string; name_en?: string; profile_image?: string };
  status: ReleaseStatus;
  current_step: number;
  track_ids: number[];
  tracks: ReleaseTrackApi[];
  shared_metadata: SharedMetadata;
  release_metadata: ReleaseMetadata;
  track_extras: Record<string, ReleaseTrackExtras>;
  validation: ReleaseValidation;
  created_at: string;
  updated_at: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  taken_down_at?: string | null;
  review_note?: string;
  admin_note?: string;
  lock_version?: number;
  revision_number?: number;
  source_release_id?: string | null;
}

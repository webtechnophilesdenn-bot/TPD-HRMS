import React, { useState, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Users,
  MessageSquare,
  Copy,
  Check,
  Clock,
  User,
  AlertCircle,
  Loader,
  Monitor,
  MoreVertical
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const MeetingRoom = ({ meetingId, onLeaveMeeting }) => { // ✅ Accept meetingId as prop
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Meeting controls
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Timer
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (meetingId) {
      loadMeeting();
    }
  }, [meetingId]);

  useEffect(() => {
    if (joined) {
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [joined]);

  const loadMeeting = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMeetingByMeetingId(meetingId);
      setMeeting(response.data);
    } catch (error) {
      showError('Meeting not found');
      if (onLeaveMeeting) {
        setTimeout(() => onLeaveMeeting(), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = async () => {
    try {
      setJoining(true);

      const joinData = {
        password: meeting.requiresPassword ? password : undefined,
      };

      if (!user) {
        if (!guestName || !guestEmail) {
          showError('Please provide name and email');
          setJoining(false);
          return;
        }
        joinData.name = guestName;
        joinData.email = guestEmail;
      }

      await apiService.joinMeeting(meetingId, password, guestName, guestEmail);
      setJoined(true);
      showSuccess('Joined meeting successfully');
    } catch (error) {
      showError(error.message || 'Failed to join meeting');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveMeeting = () => {
    if (window.confirm('Are you sure you want to leave this meeting?')) {
      if (onLeaveMeeting) {
        onLeaveMeeting();
      }
    }
  };

  const handleCopyLink = () => {
    const link = meeting.meetingLink;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    showSuccess('Meeting link copied!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Meeting Not Found</h2>
          <p className="text-gray-400 mb-6">The meeting you're looking for doesn't exist or has been cancelled.</p>
          <button
            onClick={handleLeaveMeeting}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Pre-join screen
  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-8 w-8 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{meeting.title}</h1>
              <p className="text-gray-600">
                Hosted by {meeting.organizer?.firstName} {meeting.organizer?.lastName}
              </p>
              <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(meeting.startTime).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{meeting.duration} min</span>
                </div>
              </div>
            </div>

            {/* Video Preview */}
            <div className="bg-gray-900 rounded-xl mb-6 aspect-video flex items-center justify-center relative">
              <div className="text-center">
                <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-white" />
                </div>
                <p className="text-white font-medium">
                  {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
                </p>
              </div>
              
              {/* Controls Preview */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-3 rounded-full ${isVideoOn ? 'bg-gray-700' : 'bg-red-600'}`}
                >
                  {isVideoOn ? (
                    <Video className="h-5 w-5 text-white" />
                  ) : (
                    <VideoOff className="h-5 w-5 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setIsAudioOn(!isAudioOn)}
                  className={`p-3 rounded-full ${isAudioOn ? 'bg-gray-700' : 'bg-red-600'}`}
                >
                  {isAudioOn ? (
                    <Mic className="h-5 w-5 text-white" />
                  ) : (
                    <MicOff className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Join Form */}
            <div className="space-y-4">
              {!user && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Email
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </>
              )}

              {meeting.requiresPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter meeting password"
                    required
                  />
                </div>
              )}

              <button
                onClick={handleJoinMeeting}
                disabled={joining}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {joining ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5" />
                    <span>Join Meeting</span>
                  </>
                )}
              </button>

              <button
                onClick={handleLeaveMeeting}
                className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rest of the meeting room UI (same as before with Copy button and controls)
  // ... (Keep the meeting room UI from the previous code)

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Meeting Room UI continues here - use the full code from previous response */}
      {/* Header, Video Grid, Controls, etc. */}
      <div className="bg-gray-800 px-6 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-white font-semibold">{meeting.title}</h1>
          <div className="flex items-center space-x-2 px-3 py-1 bg-red-600 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">{formatTime(elapsedTime)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyLink}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
            title="Copy meeting link"
          >
            {linkCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
          >
            <Users className="h-5 w-5" />
            <span className="text-sm">{meeting.participants?.length || 0}</span>
          </button>
        </div>
      </div>

      {/* Main Video Area - Simplified */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-16 w-16 text-white" />
          </div>
          <p className="text-white text-xl font-medium">
            {user ? `${user.firstName} ${user.lastName}` : guestName}
          </p>
          <p className="text-gray-400">In meeting room</p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setIsAudioOn(!isAudioOn)}
            className={`p-4 rounded-full transition-colors ${
              isAudioOn
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioOn ? 'Mute' : 'Unmute'}
          >
            {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </button>

          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-4 rounded-full transition-colors ${
              isVideoOn
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoOn ? 'Stop Video' : 'Start Video'}
          >
            {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </button>

          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`p-4 rounded-full transition-colors ${
              isScreenSharing
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-gray-700 hover:bg-gray-600'
            } text-white`}
            title="Share Screen"
          >
            <Monitor className="h-6 w-6" />
          </button>

          <button
            onClick={handleLeaveMeeting}
            className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium flex items-center space-x-2"
          >
            <Phone className="h-6 w-6 transform rotate-135" />
            <span>Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;

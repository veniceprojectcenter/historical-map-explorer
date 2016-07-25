#!/usr/bin/env ruby
# encoding: UTF-8

require 'httpclient'
require 'firebase'
require 'json'
require 'active_support/all'

SRC = "https://placeconsole.firebaseio.com/"
KEY = "x7EuCv8mw9AEw40gzilM9KOnIvkazIO7uSLlCClb"
FB = Firebase::Client.new(SRC, KEY); nil

features   = JSON.parse( FB.get("cartography/features").response.content ); nil
geometries = JSON.parse( FB.get("cartography/geometries").response.content ); nil

features.keys.each do |k|
  exists = false
  geometries.values.each do |v|
    exists = true if v[k]
  end
  if !exists
    puts "KO #{k} - #{features[k]['properties']['name']}"
    # File.open("puliti.json", 'a'){|f|
    #   f.puts ({ k => features[k] }.to_json)
    # } 
    # puts "FB.child(\"cartography/features/#{k}\").remove"
    # puts "open https://placeconsole.firebaseio.com/cartography/features/#{k}"
  end
end

